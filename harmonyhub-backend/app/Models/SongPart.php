<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\SongPartType;

class SongPart extends Model
{
  use HasFactory;

  protected $fillable = [
    'song_id',
    'part_type',
    'audio_file_path',
    'sheet_music_path',
    'midi_file_path',
  ];

  protected $casts = [
    'part_type' => SongPartType::class,
  ];

  public function song()
  {
    return $this->belongsTo(Song::class);
  }

  public function practiceSessions()
  {
    return $this->hasMany(PracticeSession::class);
  }
}
