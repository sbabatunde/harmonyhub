<?php

namespace Modules\Practice\app\DTOs;

use Spatie\LaravelData\Data;

class CreatePracticeSessionData extends Data
{
  public function __construct(
    public readonly int $userId,
    public readonly ?int $songPartId = null,
    public readonly string $practiceDate,
    public readonly int $durationMinutes = 0,
    public readonly ?float $averagePitchAccuracy = null,
    public readonly ?string $notes = null,
  ) {}
}
