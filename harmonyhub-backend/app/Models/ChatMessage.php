<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    protected $fillable = [
        'room_id',
        'sender_id',
        'type',
        'content',
        'voice_path',
        'voice_duration_ms',
        'voice_size_bytes',
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(ChatRoom::class, 'room_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function toClientArray(): array
    {
        return [
            'id'                => $this->id,
            'room_id'           => $this->room_id,
            'sender_id'         => $this->sender_id,
            'sender_name'       => $this->sender?->name,
            'type'              => $this->type,
            'content'           => $this->content,
            'voice_path'        => $this->voice_path,
            'voice_duration_ms' => $this->voice_duration_ms,
            'voice_size_bytes'  => $this->voice_size_bytes,
            'created_at'        => $this->created_at?->toIso8601String(),
        ];
    }
}
