<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Enums\UserRole;
use App\Enums\VoicePart;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'vocal_range_low',
        'vocal_range_high',
        'voice_part',
        'age_bracket',
        'is_minor',
        'guardian_email',
        'church_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_minor' => 'boolean',
        'role' => UserRole::class,
        'voice_part' => VoicePart::class,
    ];

    public function church()
    {
        return $this->belongsTo(Church::class);
    }

    public function practiceSessions()
    {
        return $this->hasMany(PracticeSession::class);
    }

    public function gameScores()
    {
        return $this->hasMany(GameScore::class);
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class, 'student_id');
    }

    public function userProgress()
    {
        return $this->hasMany(UserProgress::class);
    }

    public function songsCreated()
    {
        return $this->hasMany(Song::class, 'created_by');
    }
}
