<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatRoomMember extends Model
{
    protected $fillable = ['room_id', 'user_id', 'last_read_at', 'last_seen_at'];

    protected $casts = [
        'last_read_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];
}
