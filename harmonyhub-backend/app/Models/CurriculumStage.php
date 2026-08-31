<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CurriculumStage extends Model
{
  use HasFactory;

  protected $fillable = [
    'order',
    'name',
    'description',
    'required_accuracy',
  ];

  protected $casts = [
    'order' => 'integer',
    'required_accuracy' => 'integer',
  ];

  public function userProgress()
  {
    return $this->hasMany(UserProgress::class);
  }
}
