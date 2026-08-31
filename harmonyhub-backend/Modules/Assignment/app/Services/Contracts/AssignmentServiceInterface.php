<?php

namespace Modules\Assignment\app\Services\Contracts;

use Modules\Assignment\app\DTOs\CreateAssignmentData;

interface AssignmentServiceInterface
{
  public function listUserAssignments(int $userId, string $role);
  public function createAssignment(CreateAssignmentData $data);
  public function getAssignment(int $assignmentId);
  public function completeAssignment(int $assignmentId, int $userId);
}
