<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Church extends Model
{
  use HasFactory;

  protected $fillable = [
    'name',
    'timezone',
    'ccli_license_number',
  ];

  public function users()
  {
    return $this->hasMany(User::class);
  }

  public function songs()
  {
    return $this->hasMany(Song::class);
  }
}
