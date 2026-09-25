<?php

namespace Modules\Auth\App\Services;

use App\Models\User;
use Modules\Auth\App\DTOs\UserData;
use Modules\Auth\App\Services\Contracts\UserServiceInterface;

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
