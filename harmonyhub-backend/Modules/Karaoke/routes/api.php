<?php

use Illuminate\Support\Facades\Route;
use Modules\Karaoke\App\Http\Controllers\KaraokeController;


// Webhook (no auth - uses secret header)
Route::post('/karaoke/webhook', [KaraokeController::class, 'webhook'])
    ->name('api.karaoke.webhook');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/songs/{songId}/karaoke/process', [KaraokeController::class, 'requestProcessing']);
    Route::get('/songs/{songId}/karaoke/status', [KaraokeController::class, 'status']);
    Route::get('/songs/{songId}/karaoke/track', [KaraokeController::class, 'getTrack']);
    Route::put('/songs/{songId}/karaoke/lyrics', [KaraokeController::class, 'updateLyrics']);
});
