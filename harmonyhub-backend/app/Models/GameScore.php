<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\GameType;

class GameScore extends Model
{
  use HasFactory;

  protected $fillable = [
    'user_id',
    'game_type',
    'score',
    'accuracy_percentage',
  ];

  protected $casts = [
    'game_type' => GameType::class,
    'score' => 'integer',
    'accuracy_percentage' => 'decimal:2',
  ];

  public function user()
  {
    return $this->belongsTo(User::class);
  }
}
