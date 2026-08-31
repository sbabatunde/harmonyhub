<?php

namespace App\Enums;

enum UserRole: string
{
  case Student = 'student';
  case Teacher = 'teacher';
  case Admin = 'admin';

  public function label(): string
  {
    return match ($this) {
      self::Student => 'Student',
      self::Teacher => 'Teacher',
      self::Admin => 'Administrator',
    };
  }

  public function canManageSongs(): bool
  {
    return match ($this) {
      self::Student => false,
      self::Teacher, self::Admin => true,
    };
  }
}
