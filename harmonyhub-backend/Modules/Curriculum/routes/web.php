<?php

use Illuminate\Support\Facades\Route;
use Modules\Curriculum\app\Http\Controllers\CurriculumController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('curricula', CurriculumController::class)->names('curriculum');
});
