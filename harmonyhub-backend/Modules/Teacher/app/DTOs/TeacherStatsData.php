<?php

namespace Modules\Teacher\app\DTOs;

use Spatie\LaravelData\Data;

class TeacherStatsData extends Data
{
  public function __construct(
    public readonly int $totalStudents,
    public readonly int $activeStudents,
    public readonly int $totalPracticeSessions,
    public readonly float $averageAccuracy,
  ) {}
}
