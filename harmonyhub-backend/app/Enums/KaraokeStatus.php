<?php

namespace App\Enums;

enum KaraokeStatus: string
{
  case Pending = 'pending';
  case Processing = 'processing';
  case Ready = 'ready';
  case Failed = 'failed';

  public function isFinal(): bool
  {
    return in_array($this, [self::Ready, self::Failed]);
  }

  public function label(): string
  {
    return match ($this) {
      self::Pending => 'Pending',
      self::Processing => 'Processing',
      self::Ready => 'Ready',
      self::Failed => 'Failed',
    };
  }
}
