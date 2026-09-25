<?php

namespace Modules\Teacher\App\Services\Contracts;

use Illuminate\Support\Collection;
use Modules\Teacher\App\DTOs\StudentData;
use Modules\Teacher\App\DTOs\TeacherStatsData;

interface TeacherServiceInterface
{
  public function getStudents(int $churchId): Collection;
  public function getStudentDetails(int $studentId): ?StudentData;
  public function getStatistics(int $churchId): TeacherStatsData;
  public function getStudentProgress(int $studentId): array;
  public function getStudentAssignments(int $studentId): Collection;
}
