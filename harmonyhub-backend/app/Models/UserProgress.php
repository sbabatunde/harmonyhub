<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\ProgressStatus;

class UserProgress extends Model
{
  use HasFactory;

  protected $fillable = [
    'user_id',
    'curriculum_stage_id',
    'status',
    'accuracy_percentage',
    'unlocked_at',
    'completed_at',
  ];

  protected $casts = [
    'status' => ProgressStatus::class,
    'accuracy_percentage' => 'decimal:2',
    'unlocked_at' => 'datetime',
    'completed_at' => 'datetime',
  ];

  public function user()
  {
    return $this->belongsTo(User::class);
  }

  public function curriculumStage()
  {
    return $this->belongsTo(CurriculumStage::class);
  }
}
