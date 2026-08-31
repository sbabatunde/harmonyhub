<?php

use Illuminate\Support\Facades\Route;
use Modules\Assignment\app\Controllers\AssignmentController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/assignments', [AssignmentController::class, 'index']);
    Route::post('/assignments', [AssignmentController::class, 'store']);
    Route::get('/assignments/{id}', [AssignmentController::class, 'show']);
    Route::post('/assignments/{id}/complete', [AssignmentController::class, 'complete']);
    Route::delete('/assignments/{id}', [AssignmentController::class, 'destroy']);
});
