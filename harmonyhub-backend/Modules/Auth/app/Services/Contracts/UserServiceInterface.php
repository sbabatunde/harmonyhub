<?php

namespace Modules\Auth\app\Services\Contracts;

use App\Models\User;
use Modules\Auth\app\DTOs\UserData;

interface UserServiceInterface
{
  public function getCurrentUser(User $user): UserData;
  public function updateProfile(User $user, array $data): UserData;
}
