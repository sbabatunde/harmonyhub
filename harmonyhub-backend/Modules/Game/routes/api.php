<?php

use Illuminate\Support\Facades\Route;
use Modules\Game\app\Http\Controllers\GameController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/games/scores', [GameController::class, 'submitScore']);
    Route::get('/games/scores', [GameController::class, 'userScores']);
    Route::get('/games/leaderboard/{gameType}', [GameController::class, 'leaderboard']);
});
