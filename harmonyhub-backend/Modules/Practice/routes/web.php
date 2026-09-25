<?php

use Illuminate\Support\Facades\Route;
use Modules\Practice\App\Http\Controllers\PracticeController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('practices', PracticeController::class)->names('practice');
});
