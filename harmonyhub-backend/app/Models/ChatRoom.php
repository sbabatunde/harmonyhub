<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatRoom extends Model
{
    protected $fillable = ['name', 'is_group', 'created_by'];

    protected $casts = ['is_group' => 'boolean'];

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'chat_room_members')
            ->using(ChatRoomMember::class)
            ->withPivot('last_read_at', 'last_seen_at')
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'room_id');
    }

    public function latestMessage()
    {
        return $this->hasOne(ChatMessage::class, 'room_id')->latestOfMany();
    }

    public function hasMember(int $userId): bool
    {
        return $this->members()->where('users.id', $userId)->exists();
    }

    public function toClientArray(): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'is_group'   => $this->is_group,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'members'    => $this->members->map(fn(User $u) => [
                'id'           => $u->id,
                'name'         => $u->name,
                'email'        => $u->email,
                'role'         => $u->role?->value,
                'voice_part'   => $u->voice_part?->value,
                'last_seen_at' => $u->pivot?->last_seen_at?->toIso8601String(),
            ])->toArray(),
            'latest_message' => $this->latestMessage
                ? $this->latestMessage->toClientArray()
                : null,
            'unread_count' => $this->unread_count ?? 0,
        ];
    }
}
