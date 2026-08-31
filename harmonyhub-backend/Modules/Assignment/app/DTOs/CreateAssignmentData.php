<?php

namespace Modules\Assignment\app\DTOs;

use Spatie\LaravelData\Data;

class CreateAssignmentData extends Data
{
  public function __construct(
    public readonly int $studentId,
    public readonly int $songId,
    public readonly int $assignedBy,
    public readonly ?string $dueDate = null,
  ) {}
}
