<?php

use Illuminate\Support\Facades\Route;
use Modules\Practice\app\Http\Controllers\PracticeController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('practices', PracticeController::class)->names('practice');
});
