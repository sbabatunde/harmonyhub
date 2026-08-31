<?php

namespace App\Enums;

enum SongPartType: string
{
  case Soprano = 'soprano';
  case Alto = 'alto';
  case Tenor = 'tenor';
  case Bass = 'bass';
  case Lead = 'lead';
  case Harmony = 'harmony';

  public function label(): string
  {
    return match ($this) {
      self::Soprano => 'Soprano',
      self::Alto => 'Alto',
      self::Tenor => 'Tenor',
      self::Bass => 'Bass',
      self::Lead => 'Lead',
      self::Harmony => 'Harmony',
    };
  }
}
