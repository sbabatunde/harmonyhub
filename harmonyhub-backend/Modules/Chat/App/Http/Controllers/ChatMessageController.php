<?php

namespace Modules\Chat\App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\ChatRoom;
use App\Models\ChatMessage;
use Modules\Chat\App\Services\ChatService;

class ChatMessageController extends Controller
{
  public function __construct(private ChatService $chat) {}

  public function index(Request $request, ChatRoom $room): JsonResponse
  {
    $this->authorize('view', $room);

    return response()->json($this->chat->listMessages($room));
  }

  public function store(Request $request, ChatRoom $room): JsonResponse
  {
    $this->authorize('send', $room);

    $data = $request->validate([
      'content'           => ['required_without_all:song_id', 'nullable', 'string', 'max:4000'],
      'reply_to_id'       => ['nullable', 'integer', 'exists:chat_messages,id'],
      'forwarded_from_id' => ['nullable', 'integer', 'exists:chat_messages,id'],
      'song_id'           => ['nullable', 'integer', 'exists:songs,id'],
    ]);

    $message = $this->chat->sendText(
      $room,
      $request->user(),
      $data['content'] ?? '',
      $data['reply_to_id'] ?? null,
      $data['forwarded_from_id'] ?? null,
      $data['song_id'] ?? null,
    );

    return response()->json(['data' => $message->toClientArray()], 201);
  }

  public function update(Request $request, ChatRoom $room, ChatMessage $message): JsonResponse
  {
    $this->authorize('view', $room);

    $data = $request->validate([
      'content' => ['required', 'string', 'max:4000'],
    ]);

    $updated = $this->chat->editMessage($message, $request->user(), $data['content']);

    return response()->json(['data' => $updated->toClientArray()]);
  }

  public function destroy(Request $request, ChatRoom $room, ChatMessage $message): JsonResponse
  {
    $this->authorize('view', $room);
    $this->chat->deleteMessage($message, $request->user());

    return response()->json(['ok' => true]);
  }

  public function pin(Request $request, ChatRoom $room, ChatMessage $message): JsonResponse
  {
    $this->authorize('view', $room);

    $pinned = $request->boolean('pinned', true);
    $updated = $this->chat->pinMessage($message, $request->user(), $pinned);

    return response()->json(['data' => $updated->toClientArray()]);
  }

  public function pinned(Request $request, ChatRoom $room): JsonResponse
  {
    $this->authorize('view', $room);

    return response()->json([
      'data' => $this->chat->listPinnedMessages($room)
        ->map(fn($m) => $m->toClientArray()),
    ]);
  }

  public function markRead(Request $request, ChatRoom $room): JsonResponse
  {
    $this->authorize('view', $room);
    $this->chat->markRead($room, $request->user());

    return response()->json(['ok' => true]);
  }

  public function typing(Request $request, ChatRoom $room): JsonResponse
  {
    $this->authorize('send', $room);
    broadcast(new \Modules\Chat\App\Events\UserTyping(
      $room->id,
      $request->user()->id,
      $request->user()->name,
      $request->boolean('typing', true),
    ))->toOthers();

    return response()->json(['ok' => true]);
  }
}
