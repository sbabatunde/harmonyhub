<?php

use Illuminate\Support\Facades\Route;
use Modules\Song\App\Controllers\SongController;
use Modules\Song\App\Controllers\SongPartController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/songs', [SongController::class, 'index']);
    Route::get('/songs/{id}', [SongController::class, 'show']);

    Route::middleware('role:teacher,admin')->group(function () {
        Route::post('/songs', [SongController::class, 'store']);
        Route::put('/songs/{id}', [SongController::class, 'update']);
        Route::delete('/songs/{id}', [SongController::class, 'destroy']);
    });

    Route::get('/songs/{songId}/parts', [SongPartController::class, 'index']);
    Route::post('/songs/{songId}/parts', [SongPartController::class, 'store']);
    Route::get('/songs/{songId}/parts/{partId}', [SongPartController::class, 'show']);
    Route::put('/songs/{songId}/parts/{partId}', [SongPartController::class, 'update']);
    Route::delete('/songs/{songId}/parts/{partId}', [SongPartController::class, 'destroy']);
});
