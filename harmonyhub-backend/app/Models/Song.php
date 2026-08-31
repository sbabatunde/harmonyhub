<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Song extends Model
{
  use HasFactory;

  protected $fillable = [
    'title',
    'artist',
    'key_signature',
    'tempo',
    'difficulty_level',
    'audio_file_path',
    'sheet_music_path',
    'is_public_domain',
    'licensing_info',
    'created_by',
    'church_id',
  ];

  protected $casts = [
    'is_public_domain' => 'boolean',
    'tempo' => 'integer',
    'difficulty_level' => 'integer',
  ];

  public function parts()
  {
    return $this->hasMany(SongPart::class);
  }

  public function karaokeTrack()
  {
    return $this->hasOne(KaraokeTrack::class);
  }

  public function createdBy()
  {
    return $this->belongsTo(User::class, 'created_by');
  }

  public function church()
  {
    return $this->belongsTo(Church::class);
  }

  public function assignments()
  {
    return $this->hasMany(Assignment::class);
  }
}
