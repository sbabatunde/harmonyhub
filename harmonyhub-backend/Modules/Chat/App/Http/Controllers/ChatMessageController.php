<?php

namespace Modules\Chat\App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\ChatRoom;
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

    $data = $request->validate(['content' => ['required', 'string', 'max:4000']]);

    $message = $this->chat->sendText($room, $request->user(), $data['content']);

    return response()->json(['data' => $message->toClientArray()], 201);
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
