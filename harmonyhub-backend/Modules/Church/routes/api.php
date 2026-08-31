<?php

use Illuminate\Support\Facades\Route;
use Modules\Church\app\Http\Controllers\ChurchController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('churches', ChurchController::class)->names('church');
});
