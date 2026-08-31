<?php

use Illuminate\Support\Facades\Route;
use Modules\Song\app\Controllers\SongController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('songs', SongController::class)->names('song');
});
