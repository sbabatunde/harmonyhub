<?php

namespace Modules\Chat\App\Services;

use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Chat\App\Events\MessageDeleted;
use Modules\Chat\App\Events\MessageSent;
use Modules\Chat\App\Events\MessageUpdated;

class ChatService
{
  public function listRoomsFor(User $user)
  {
    return ChatRoom::query()
      ->whereHas('members', fn($q) => $q->where('users.id', $user->id))
      ->with([
        'members' => fn($q) => $q->withPivot('last_seen_at'),
        'latestMessage.sender:id,name',
      ])
      ->orderByDesc('updated_at')
      ->get();
  }

  public function findOrCreateDirectRoom(User $a, User $b): ChatRoom
  {
    $existing = ChatRoom::query()
      ->where('is_group', false)
      ->whereHas('members', fn($q) => $q->where('users.id', $a->id))
      ->whereHas('members', fn($q) => $q->where('users.id', $b->id))
      ->withCount('members')
      ->get()
      ->first(fn(ChatRoom $room) => $room->members_count === 2);

    if ($existing) {
      return $existing->load('members:id,name,email,role');
    }

    $room = ChatRoom::create([
      'is_group'   => false,
      'created_by' => $a->id,
    ]);
    $room->members()->attach([$a->id, $b->id]);

    return $room->load('members:id,name,email,role');
  }
  public function createGroup(User $creator, string $name, array $memberIds): ChatRoom
  {
    $room = ChatRoom::create([
      'name'       => $name,
      'is_group'   => true,
      'created_by' => $creator->id,
    ]);
    $room->members()->attach(array_unique([$creator->id, ...$memberIds]));

    return $room->load('members:id,name,email,role');
  }

  public function listMessages(ChatRoom $room, int $perPage = 30)
  {
    return $room->messages()
      ->with([
        'sender:id,name',
        'replyTo.sender:id,name',
        'song:id,title,artist',
      ])
      ->orderByDesc('created_at')
      ->paginate($perPage);
  }

  public function sendText(
    ChatRoom $room,
    User $sender,
    string $content,
    ?int $replyToId = null,
    ?int $forwardedFromId = null,
    ?int $songId = null,
  ): ChatMessage {
    $message = ChatMessage::create([
      'room_id'           => $room->id,
      'sender_id'         => $sender->id,
      'reply_to_id'       => $replyToId,
      'forwarded_from_id' => $forwardedFromId,
      'song_id'           => $songId,
      'type'              => 'text',
      'content'           => $content,
    ]);
    $room->touch();
    broadcast(new MessageSent($message))->toOthers();

    return $message->load(['sender:id,name', 'replyTo.sender:id,name', 'song:id,title,artist']);
  }

  public function editMessage(ChatMessage $message, User $user, string $content): ChatMessage
  {
    if (! $message->isEditableBy($user)) {
      abort(403, 'This message can no longer be edited.');
    }

    $message->update([
      'content'   => $content,
      'edited_at' => now(),
    ]);

    $message = $message->fresh(['sender:id,name', 'replyTo.sender:id,name', 'song:id,title,artist']);
    broadcast(new MessageUpdated($message))->toOthers();

    return $message;
  }

  public function deleteMessage(ChatMessage $message, User $user): void
  {
    if (! $message->isDeletableBy($user)) {
      abort(403, 'You cannot delete this message.');
    }

    // Soft-delete + scrub content so the UI shows "This message was deleted"
    $message->update(['content' => null, 'voice_path' => null]);
    $message->delete();

    broadcast(new MessageDeleted($message->id, $message->room_id))->toOthers();
  }

  public function pinMessage(ChatMessage $message, User $user, bool $pinned): ChatMessage
  {
    if (! $message->room->hasMember($user->id)) {
      abort(403);
    }

    $message->update([
      'pinned_at' => $pinned ? now() : null,
      'pinned_by' => $pinned ? $user->id : null,
    ]);

    $message = $message->fresh(['sender:id,name', 'replyTo.sender:id,name', 'song:id,title,artist']);
    broadcast(new MessageUpdated($message))->toOthers();

    return $message;
  }

  public function listPinnedMessages(ChatRoom $room)
  {
    return $room->messages()
      ->whereNotNull('pinned_at')
      ->with(['sender:id,name', 'song:id,title,artist'])
      ->orderByDesc('pinned_at')
      ->get();
  }

  public function touchPresence(ChatRoom $room, User $user): void
  {
    $room->members()->updateExistingPivot($user->id, ['last_seen_at' => now()]);
  }

  public function sendVoice(
    ChatRoom $room,
    User $sender,
    string $voicePath,
    int $durationMs,
    int $sizeBytes,
  ): ChatMessage {
    $message = ChatMessage::create([
      'room_id'           => $room->id,
      'sender_id'         => $sender->id,
      'type'              => 'voice',
      'voice_path'        => $voicePath,
      'voice_duration_ms' => $durationMs,
      'voice_size_bytes'  => $sizeBytes,
    ]);
    $room->touch();
    broadcast(new MessageSent($message))->toOthers();

    return $message->load('sender:id,name');
  }

  public function presignVoiceUpload(ChatRoom $room, User $sender, string $mime, int $sizeBytes): array
  {
    if ($sizeBytes > 1 * 1024 * 1024) {
      abort(422, 'Voice message too large (max 1 MB).');
    }
    $allowed = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg'];
    if (! in_array($mime, $allowed, true)) {
      abort(422, 'Unsupported audio format.');
    }

    $ext = match ($mime) {
      'audio/webm' => 'webm',
      'audio/mp4'  => 'm4a',
      'audio/mpeg' => 'mp3',
      'audio/ogg'  => 'ogg',
    };
    $key = sprintf('chat/%d/%s.%s', $room->id, Str::uuid(), $ext);

    $uploadUrl = Storage::disk('r2')->temporaryUploadUrl(
      $key,
      now()->addMinutes(5),
      ['ContentType' => $mime],
    );

    return [
      'key'        => $key,
      'upload_url' => $uploadUrl['url'] ?? $uploadUrl,
      'headers'    => ['Content-Type' => $mime],
    ];
  }

  public function presignVoiceDownload(ChatRoom $room, ChatMessage $message): string
  {
    abort_unless($message->room_id === $room->id && $message->type === 'voice', 404);

    return Storage::disk('r2')->temporaryUrl($message->voice_path, now()->addMinutes(10));
  }

  public function markRead(ChatRoom $room, User $user): void
  {
    $room->members()->updateExistingPivot($user->id, ['last_read_at' => now()]);
  }

  public function touchPresenceForAllRooms(User $user): void
  {
    DB::table('chat_room_members')
      ->where('user_id', $user->id)
      ->update(['last_seen_at' => now()]);
  }
}
