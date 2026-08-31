<?php

namespace Modules\Assignment\app\Services;

use App\Enums\UserRole;
use App\Models\Assignment;
use App\Models\Song;
use App\Models\User;
use Modules\Assignment\app\DTOs\CreateAssignmentData;
use Modules\Assignment\app\Services\Contracts\AssignmentServiceInterface;

class AssignmentService implements AssignmentServiceInterface
{
  public function listUserAssignments(int $userId, UserRole|string $role)
  {
    // Convert enum to string if needed
    $roleString = $role instanceof UserRole ? $role->value : $role;

    $query = Assignment::with(['song', 'student', 'assignedBy']);

    if ($roleString === 'student') {
      $query->where('student_id', $userId);
    } elseif ($roleString === 'teacher') {
      $query->where('assigned_by', $userId);
    }

    return $query->orderBy('created_at', 'desc')->paginate(20);
  }

  public function createAssignment(CreateAssignmentData $data)
  {
    // Verify student exists and is in same church
    $student = User::where('id', $data->studentId)
      ->where('role', 'student')
      ->first();

    if (!$student) {
      throw new \Exception('Invalid student');
    }

    // Verify song exists
    $song = Song::find($data->songId);

    if (!$song) {
      throw new \Exception('Invalid song');
    }

    return Assignment::create([
      'student_id' => $data->studentId,
      'song_id' => $data->songId,
      'assigned_by' => $data->assignedBy,
      'due_date' => $data->dueDate,
    ]);
  }

  public function getAssignment(int $assignmentId)
  {
    return Assignment::with(['song.parts', 'student', 'assignedBy'])
      ->find($assignmentId);
  }

  public function completeAssignment(int $assignmentId, int $userId)
  {
    $assignment = Assignment::find($assignmentId);

    if (!$assignment || $assignment->student_id !== $userId) {
      return null;
    }

    $assignment->update([
      'completed_at' => now(),
    ]);

    return $assignment->fresh();
  }

  public function deleteAssignment(int $assignmentId, int $userId): bool
  {
    $assignment = Assignment::find($assignmentId);

    if (!$assignment) {
      return false;
    }

    // Only teacher who assigned it or admin can delete
    if ($assignment->assigned_by !== $userId && auth()->user()->role !== 'admin') {
      return false;
    }

    return $assignment->delete();
  }
}
