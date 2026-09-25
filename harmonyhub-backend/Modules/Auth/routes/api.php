<?php

use Illuminate\Support\Facades\Route;
use Modules\Auth\App\Controllers\AuthController;
use Modules\Auth\App\Controllers\UserController;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [UserController::class, 'currentUser']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
});
