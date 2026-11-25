<?php

namespace Modules\Chat\App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\ChatRoom;
use Modules\Chat\App\Services\ChatService;

class ChatRoomController extends Controller
{
  public function __construct(private ChatService $chat) {}

  public function index(Request $request): JsonResponse
  {
    $user = $request->user();
    $this->chat->touchPresenceForAllRooms($user);

    return response()->json([
      'data' => $this->chat->listRoomsFor($user)
        ->map(fn($room) => $room->toClientArray())
        ->all(),
    ]);
  }

  public function show(Request $request, ChatRoom $room): JsonResponse
  {
    $this->authorize('view', $room);
    $room->load([
      'members' => fn($q) => $q->withPivot('last_seen_at'),
    ]);

    return response()->json(['data' => $room->toClientArray()]);
  }

  public function store(Request $request): JsonResponse
  {
    $data = $request->validate([
      'name'         => ['nullable', 'string', 'max:120'],
      'is_group'     => ['boolean'],
      'member_ids'   => ['required', 'array', 'min:1'],
      'member_ids.*' => ['integer', 'exists:users,id'],
    ]);

    $user = $request->user();

    if (empty($data['is_group']) && count($data['member_ids']) === 1) {
      $other = User::findOrFail($data['member_ids'][0]);
      $room  = $this->chat->findOrCreateDirectRoom($user, $other);
    } else {
      abort_unless(
        $user->role === \App\Enums\UserRole::Teacher
          || $user->role === \App\Enums\UserRole::Admin,
        403,
      );
      $room = $this->chat->createGroup($user, $data['name'] ?? 'Group', $data['member_ids']);
    }

    return response()->json(['data' => $room->toClientArray()], 201);
  }
}
