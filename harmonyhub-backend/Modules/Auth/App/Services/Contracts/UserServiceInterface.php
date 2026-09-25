<?php

namespace Modules\Auth\App\Services\Contracts;

use App\Models\User;
use Modules\Auth\App\DTOs\UserData;

interface UserServiceInterface
{
  public function getCurrentUser(User $user): UserData;
  public function updateProfile(User $user, array $data): UserData;
}
