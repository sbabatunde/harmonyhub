<?php

use Illuminate\Support\Facades\Route;
use Modules\Chat\App\Http\Controllers\ChatMessageController;
use Modules\Chat\App\Http\Controllers\ChatRoomController;
use Modules\Chat\App\Http\Controllers\ChatVoiceController;
use Modules\Chat\App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('chats', ChatController::class)->names('chat');
});

Route::middleware('auth:sanctum')->prefix('chat')->group(function () {
    Route::get('rooms',              [ChatRoomController::class, 'index']);
    Route::post('rooms',             [ChatRoomController::class, 'store']);
    Route::get('rooms/{room}',       [ChatRoomController::class, 'show']);

    Route::get('rooms/{room}/messages',  [ChatMessageController::class, 'index']);
    Route::post('rooms/{room}/messages', [ChatMessageController::class, 'store']);
    Route::post('rooms/{room}/read',     [ChatMessageController::class, 'markRead']);
    Route::post('rooms/{room}/typing',   [ChatMessageController::class, 'typing']);

    Route::post('rooms/{room}/voice/presign', [ChatVoiceController::class, 'presign']);
    Route::post('rooms/{room}/voice',         [ChatVoiceController::class, 'store']);
    Route::get('rooms/{room}/messages/{message}/voice-url', [ChatVoiceController::class, 'download']);

    Route::patch('rooms/{room}/messages/{message}', [ChatMessageController::class, 'update']);
    Route::delete('rooms/{room}/messages/{message}', [ChatMessageController::class, 'destroy']);
    Route::post('rooms/{room}/messages/{message}/pin', [ChatMessageController::class, 'pin']);
    Route::get('rooms/{room}/pinned', [ChatMessageController::class, 'pinned']);
});
