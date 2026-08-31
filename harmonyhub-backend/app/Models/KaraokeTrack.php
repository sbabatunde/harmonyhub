<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\KaraokeStatus;

class KaraokeTrack extends Model
{
  use HasFactory;

  protected $fillable = [
    'song_id',
    'instrumental_file_path',
    'vocal_file_path',
    'lyrics_data',
    'status',
    'error_message',
  ];

  protected $casts = [
    'lyrics_data' => 'array',
    'status' => KaraokeStatus::class,
  ];

  public function song()
  {
    return $this->belongsTo(Song::class);
  }
}
