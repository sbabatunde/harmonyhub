<?php

use Illuminate\Support\Facades\Route;
use Modules\Karaoke\App\Http\Controllers\KaraokeController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('karaokes', KaraokeController::class)->names('karaoke');
});
