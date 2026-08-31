<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PracticeSession extends Model
{
  use HasFactory;

  protected $fillable = [
    'user_id',
    'song_part_id',
    'practice_date',
    'duration_minutes',
    'average_pitch_accuracy',
    'notes',
  ];

  protected $casts = [
    'practice_date' => 'date',
    'duration_minutes' => 'integer',
    'average_pitch_accuracy' => 'decimal:2',
  ];

  public function user()
  {
    return $this->belongsTo(User::class);
  }

  public function songPart()
  {
    return $this->belongsTo(SongPart::class);
  }
}
