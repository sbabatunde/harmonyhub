<?php

use Illuminate\Support\Facades\Route;
use Modules\Curriculum\app\Http\Controllers\CurriculumController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/curriculum', [CurriculumController::class, 'index']);
    Route::get('/curriculum/{id}', [CurriculumController::class, 'show']);
    Route::get('/curriculum/progress', [CurriculumController::class, 'userProgress']);
    Route::post('/curriculum/{stageId}/progress', [CurriculumController::class, 'updateProgress']);
});
