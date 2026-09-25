<?php

use Illuminate\Support\Facades\Route;
use Modules\AICoach\App\Http\Controllers\AICoachController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/coach/feedback', [AICoachController::class, 'getFeedback']);
    Route::get('/coach/summary', [AICoachController::class, 'getSummary']);
});
