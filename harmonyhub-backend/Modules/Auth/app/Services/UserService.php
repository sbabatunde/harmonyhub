<?php

namespace Modules\Auth\app\Services;

use App\Models\User;
use Modules\Auth\app\DTOs\UserData;
use Modules\Auth\app\Services\Contracts\UserServiceInterface;

class UserService implements UserServiceInterface
{
  public function getCurrentUser(User $user): UserData
  {
    return UserData::fromModel($user->load('church'));
  }

  public function updateProfile(User $user, array $data): UserData
  {
    $user->update($data);

    return UserData::fromModel($user->fresh());
  }
}
