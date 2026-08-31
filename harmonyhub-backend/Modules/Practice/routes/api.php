<?php

use Illuminate\Support\Facades\Route;
use Modules\Practice\app\Http\Controllers\PracticeController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/practice/sessions', [PracticeController::class, 'index']);
    Route::post('/practice/sessions', [PracticeController::class, 'store']);
    Route::get('/practice/statistics', [PracticeController::class, 'statistics']);
    Route::get('/practice/sessions/{id}', [PracticeController::class, 'show']);
    Route::put('/practice/sessions/{id}', [PracticeController::class, 'update']);
    Route::delete('/practice/sessions/{id}', [PracticeController::class, 'destroy']);
});
