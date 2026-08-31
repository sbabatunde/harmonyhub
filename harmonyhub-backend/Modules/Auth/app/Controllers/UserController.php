<?php

namespace Modules\Auth\app\Controllers;

use App\Support\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Modules\Auth\app\Requests\UpdateProfileRequest;
use Modules\Auth\app\Services\Contracts\UserServiceInterface;

class UserController
{
  use ApiResponseTrait;

  public function __construct(
    private readonly UserServiceInterface $userService
  ) {}

  public function currentUser(): JsonResponse
  {
    $userData = $this->userService->getCurrentUser(auth()->user());

    return $this->successResponse($userData);
  }

  public function updateProfile(UpdateProfileRequest $request): JsonResponse
  {
    $userData = $this->userService->updateProfile(
      auth()->user(),
      $request->validated()
    );

    return $this->successResponse($userData, 'Profile updated successfully');
  }
}
