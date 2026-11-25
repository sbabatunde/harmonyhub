<?php

namespace Modules\Chat\App\Policies;

use App\Enums\UserRole;
use App\Models\ChatRoom;
use App\Models\User;

class ChatRoomPolicy
{
  public function view(User $user, ChatRoom $room): bool
  {
    return $user->role === UserRole::Admin || $room->hasMember($user->id);
  }

  public function send(User $user, ChatRoom $room): bool
  {
    return $room->hasMember($user->id);
  }
}
