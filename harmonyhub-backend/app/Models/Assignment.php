<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
  use HasFactory;

  protected $fillable = [
    'student_id',
    'song_id',
    'due_date',
    'assigned_by',
    'completed_at',
  ];

  protected $casts = [
    'due_date' => 'date',
    'completed_at' => 'datetime',
  ];

  public function student()
  {
    return $this->belongsTo(User::class, 'student_id');
  }

  public function song()
  {
    return $this->belongsTo(Song::class);
  }

  public function assignedBy()
  {
    return $this->belongsTo(User::class, 'assigned_by');
  }
}
