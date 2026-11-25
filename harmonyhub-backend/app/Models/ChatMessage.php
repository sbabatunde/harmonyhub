<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChatMessage extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'room_id',
        'sender_id',
        'reply_to_id',
        'forwarded_from_id',
        'type',
        'content',
        'song_id',
        'voice_path',
        'voice_duration_ms',
        'voice_size_bytes',
        'edited_at',
        'pinned_at',
        'pinned_by',
    ];

    protected $casts = [
        'edited_at'  => 'datetime',
        'pinned_at'  => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(ChatRoom::class, 'room_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(ChatMessage::class, 'reply_to_id');
    }

    public function forwardedFrom(): BelongsTo
    {
        return $this->belongsTo(ChatMessage::class, 'forwarded_from_id');
    }

    public function song(): BelongsTo
    {
        return $this->belongsTo(Song::class, 'song_id');
    }

    public function pinnedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pinned_by');
    }

    public function isEditableBy(User $user): bool
    {
        if ($this->sender_id !== $user->id) return false;
        if ($this->type !== 'text') return false;
        if ($this->trashed()) return false;
        return $this->created_at->diffInMinutes(now()) <= 10;
    }

    public function isDeletableBy(User $user): bool
    {
        if ($this->sender_id === $user->id) return true;
        if ($user->role === UserRole::Admin) return true;
        if ($user->role === UserRole::Teacher) {
            return $this->room?->created_by === $user->id;
        }
        return false;
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
            'edited_at'         => $this->edited_at?->toIso8601String(),
            'pinned_at'         => $this->pinned_at?->toIso8601String(),
            'pinned_by'         => $this->pinned_by,
            'deleted_at'        => $this->deleted_at?->toIso8601String(),
            'created_at'        => $this->created_at?->toIso8601String(),
            'reply_to'          => $this->replyTo ? [
                'id'          => $this->replyTo->id,
                'sender_name' => $this->replyTo->sender?->name,
                'content'     => $this->replyTo->content,
                'type'        => $this->replyTo->type,
            ] : null,
            'forwarded_from'    => $this->forwardedFrom ? [
                'id'          => $this->forwardedFrom->id,
                'sender_name' => $this->forwardedFrom->sender?->name,
            ] : null,
            'song'              => $this->song ? [
                'id'     => $this->song->id,
                'title'  => $this->song->title,
                'artist' => $this->song->artist,
            ] : null,
        ];
    }
}
