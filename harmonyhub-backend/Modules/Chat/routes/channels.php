<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\ChatRoom;

Broadcast::channel('chat.room.{roomId}', function ($user, $roomId) {
  $room = ChatRoom::find($roomId);
  return $room && ($user->role === 'admin' || $room->hasMember($user->id));
});
