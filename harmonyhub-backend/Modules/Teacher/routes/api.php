<?php

use Illuminate\Support\Facades\Route;
use Modules\Teacher\App\Http\Controllers\TeacherController;

Route::middleware(['auth:sanctum', 'role:teacher,admin'])->group(function () {
    Route::get('/teacher/students', [TeacherController::class, 'students']);
    Route::get('/teacher/students/{studentId}', [TeacherController::class, 'studentDetails']);
    Route::get('/teacher/students/{studentId}/progress', [TeacherController::class, 'studentProgress']);
    Route::get('/teacher/students/{studentId}/assignments', [TeacherController::class, 'studentAssignments']);
    Route::get('/teacher/statistics', [TeacherController::class, 'statistics']);
});
