<?php

namespace Modules\Chat\App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Chat\App\Events\MessageSent;
use App\Models\ChatMessage;
use App\Models\ChatRoom;

class ChatService
{
  public function listRoomsFor(User $user)
  {
    return ChatRoom::query()
      ->whereHas('members', fn($q) => $q->where('users.id', $user->id))
      ->orWhere('created_by', $user->id)
      ->with(['members:id,name,email,role', 'latestMessage.sender:id,name'])
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
      ->having('members_count', 2)
      ->first();

    if ($existing) return $existing;

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
      ->with('sender:id,name')
      ->orderByDesc('created_at')
      ->paginate($perPage);
  }

  public function sendText(ChatRoom $room, User $sender, string $content): ChatMessage
  {
    $message = ChatMessage::create([
      'room_id'   => $room->id,
      'sender_id' => $sender->id,
      'type'      => 'text',
      'content'   => $content,
    ]);
    $room->touch();
    broadcast(new MessageSent($message))->toOthers();

    return $message->load('sender:id,name');
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
    if ($sizeBytes > 10 * 1024 * 1024) {
      abort(422, 'Voice message too large (max 10 MB).');
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
}
