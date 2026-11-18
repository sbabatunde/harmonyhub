<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

// routes/web.php
Route::get('/login', fn() => response()->json(['message' => 'Unauthenticated.'], 401))
    ->name('login');


Route::get('/test-broadcast', function () {
    broadcast(new \Modules\Chat\App\Events\MessageSent(
        App\Models\ChatMessage::create([
            'room_id'   => 1,
            'sender_id' => 1,
            'type'      => 'text',
            'content'   => 'hello from reverb test',
        ])
    ));
    return 'broadcast fired';
});
