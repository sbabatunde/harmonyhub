<?php

use Illuminate\Support\Facades\Route;
use Modules\Karaoke\app\Http\Controllers\KaraokeController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('karaokes', KaraokeController::class)->names('karaoke');
});
