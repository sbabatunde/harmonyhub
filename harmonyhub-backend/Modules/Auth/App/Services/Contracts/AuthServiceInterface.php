<?php

namespace Modules\Auth\App\Services\Contracts;

use App\Models\User;
use Modules\Auth\App\DTOs\RegisterUserData;
use Modules\Auth\App\DTOs\LoginUserData;
use Modules\Auth\App\DTOs\AuthResponseData;

interface AuthServiceInterface
{
  public function register(RegisterUserData $data): AuthResponseData;
  public function login(LoginUserData $data): AuthResponseData;
  public function logout(User $user): void;
}
