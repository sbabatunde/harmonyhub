<?php

namespace Modules\Teacher\app\Services\Contracts;

use Illuminate\Support\Collection;
use Modules\Teacher\app\DTOs\StudentData;
use Modules\Teacher\app\DTOs\TeacherStatsData;

interface TeacherServiceInterface
{
  public function getStudents(int $churchId): Collection;
  public function getStudentDetails(int $studentId): ?StudentData;
  public function getStatistics(int $churchId): TeacherStatsData;
  public function getStudentProgress(int $studentId): array;
  public function getStudentAssignments(int $studentId): Collection;
}
