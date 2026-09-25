<?php

namespace Modules\Game\App\DTOs;

use Spatie\LaravelData\Data;

class SubmitScoreData extends Data
{
  public function __construct(
    public readonly int $userId,
    public readonly string $gameType,
    public readonly int $score,
    public readonly ?float $accuracyPercentage = null,
  ) {}
}
