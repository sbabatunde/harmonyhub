<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});


// routes/web.php or routes/api.php (temporary)
Route::get('/debug-disk', function () {
    return [
        'default_disk' => config('filesystems.default'),
        'disk_url' => Storage::disk(config('filesystems.default'))->url('songs/audio/test.mp3'),
        'env_filesystem' => env('FILESYSTEM_DISK'),
    ];
});
