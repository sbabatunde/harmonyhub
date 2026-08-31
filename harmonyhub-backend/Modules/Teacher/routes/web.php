<?php

use Illuminate\Support\Facades\Route;
use Modules\Teacher\app\Http\Controllers\TeacherController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('teachers', TeacherController::class)->names('teacher');
});

Route::get('/', function () {
    return view('teacher::index');
});
