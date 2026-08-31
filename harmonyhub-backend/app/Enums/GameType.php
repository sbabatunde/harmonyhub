<?php

namespace App\Enums;

enum GameType: string
{
  case PitchPerfect = 'pitch_perfect';
  case IntervalTrainer = 'interval_trainer';
  case RhythmMaster = 'rhythm_master';

  public function label(): string
  {
    return match ($this) {
      self::PitchPerfect => 'Pitch Perfect',
      self::IntervalTrainer => 'Interval Trainer',
      self::RhythmMaster => 'Rhythm Master',
    };
  }
}
