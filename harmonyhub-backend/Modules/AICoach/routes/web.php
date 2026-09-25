<?php

use Illuminate\Support\Facades\Route;
use Modules\AICoach\App\Http\Controllers\AICoachController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('aicoaches', AICoachController::class)->names('aicoach');
});
