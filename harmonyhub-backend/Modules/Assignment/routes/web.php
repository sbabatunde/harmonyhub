<?php

use Illuminate\Support\Facades\Route;
use Modules\Assignment\app\Controllers\AssignmentController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('assignments', AssignmentController::class)->names('assignment');
});
