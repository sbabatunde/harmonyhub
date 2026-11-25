<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class ChatRoomMember extends Pivot
{
    protected $table = 'chat_room_members';

    protected $fillable = ['room_id', 'user_id', 'last_read_at', 'last_seen_at'];

    protected $casts = [
        'last_read_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];
}
