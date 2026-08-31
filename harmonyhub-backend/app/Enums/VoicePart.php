<?php

namespace App\Enums;

enum VoicePart: string
{
  case Soprano = 'soprano';
  case Alto = 'alto';
  case Tenor = 'tenor';
  case Bass = 'bass';
  case Unknown = 'unknown';

  public function label(): string
  {
    return match ($this) {
      self::Soprano => 'Soprano',
      self::Alto => 'Alto',
      self::Tenor => 'Tenor',
      self::Bass => 'Bass',
      self::Unknown => 'Unknown',
    };
  }
}
