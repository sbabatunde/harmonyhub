<?php

namespace Modules\Auth\App\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Auth\App\Requests\RegisterUserRequest;
use Modules\Auth\App\Requests\LoginUserRequest;
use Modules\Auth\App\Services\Contracts\AuthServiceInterface;
use App\Support\Traits\ApiResponseTrait;

class AuthController
{
    use ApiResponseTrait;

    public function __construct(
        private readonly AuthServiceInterface $authService
    ) {}

    public function register(RegisterUserRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->toDTO());

        return $this->successResponse($result, 'User registered successfully', 201);
    }

    public function login(LoginUserRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->toDTO());

        // Ensure session is saved
        session()->save();

        return $this->successResponse($result, 'Login successful');
    }

    public function logout(): JsonResponse
    {
        $this->authService->logout(auth()->user());

        return $this->successResponse(null, 'Logged out successfully');
    }
}
