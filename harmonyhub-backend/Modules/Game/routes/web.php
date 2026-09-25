<?php

use Illuminate\Support\Facades\Route;
use Modules\Game\App\Http\Controllers\GameController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('games', GameController::class)->names('game');
});
