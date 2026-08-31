<?php

namespace Modules\Auth\app\Services\Contracts;

use App\Models\User;
use Modules\Auth\app\DTOs\RegisterUserData;
use Modules\Auth\app\DTOs\LoginUserData;
use Modules\Auth\app\DTOs\AuthResponseData;

interface AuthServiceInterface
{
  public function register(RegisterUserData $data): AuthResponseData;
  public function login(LoginUserData $data): AuthResponseData;
  public function logout(User $user): void;
}
