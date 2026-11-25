<?php

namespace Modules\Chat\App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use Modules\Chat\App\Services\ChatService;

class ChatVoiceController extends Controller
{
  public function __construct(private ChatService $chat) {}

  public function presign(Request $request, ChatRoom $room): JsonResponse
  {
    $this->authorize('send', $room);

    $data = $request->validate([
      'mime'       => ['required', 'string'],
      'size_bytes' => ['required', 'integer', 'min:1'],
    ]);

    return response()->json([
      'data' => $this->chat->presignVoiceUpload(
        $room,
        $request->user(),
        $data['mime'],
        $data['size_bytes'],
      ),
    ]);
  }

  public function store(Request $request, ChatRoom $room): JsonResponse
  {
    $this->authorize('send', $room);

    $data = $request->validate([
      'voice_path'        => ['required', 'string'],
      'voice_duration_ms' => ['required', 'integer', 'min:1', 'max:300000'],
      'voice_size_bytes'  => ['required', 'integer', 'min:1', 'max:1048576'],  // 1 MB
    ]);

    $message = $this->chat->sendVoice(
      $room,
      $request->user(),
      $data['voice_path'],
      $data['voice_duration_ms'],
      $data['voice_size_bytes'],
    );

    return response()->json(['data' => $message->toClientArray()], 201);
  }

  public function download(Request $request, ChatRoom $room, ChatMessage $message): JsonResponse
  {
    $this->authorize('view', $room);

    return response()->json([
      'url' => $this->chat->presignVoiceDownload($room, $message),
    ]);
  }
}
