<?php

namespace Modules\Teacher\app\Services;

use App\Models\User;
use App\Models\PracticeSession;
use App\Models\Assignment;
use App\Models\GameScore;
use App\Models\UserProgress;
use Illuminate\Support\Collection;
use Modules\Teacher\app\DTOs\StudentData;
use Modules\Teacher\app\DTOs\TeacherStatsData;
use Modules\Teacher\app\Services\Contracts\TeacherServiceInterface;
use Carbon\Carbon;

class TeacherService implements TeacherServiceInterface
{
  public function getStudents(int $churchId): Collection
  {
    $students = User::where('church_id', $churchId)
      ->where('role', 'student')
      ->withCount('practiceSessions')
      ->withAvg('practiceSessions as average_accuracy', 'average_pitch_accuracy')
      ->get();

    return $students->map(fn($student) => StudentData::fromModel($student));
  }

  public function getStudentDetails(int $studentId): ?StudentData
  {
    $student = User::where('role', 'student')
      ->withCount('practiceSessions')
      ->withAvg('practiceSessions as average_accuracy', 'average_pitch_accuracy')
      ->find($studentId);

    return $student ? StudentData::fromModel($student) : null;
  }

  public function getStatistics(int $churchId): TeacherStatsData
  {
    $studentIds = User::where('church_id', $churchId)
      ->where('role', 'student')
      ->pluck('id');

    $totalStudents = $studentIds->count();

    $activeStudents = PracticeSession::whereIn('user_id', $studentIds)
      ->where('practice_date', '>=', Carbon::now()->subDays(7))
      ->distinct('user_id')
      ->count();

    $totalPracticeSessions = PracticeSession::whereIn('user_id', $studentIds)->count();

    $averageAccuracy = PracticeSession::whereIn('user_id', $studentIds)
      ->whereNotNull('average_pitch_accuracy')
      ->avg('average_pitch_accuracy') ?? 0;

    return new TeacherStatsData(
      totalStudents: $totalStudents,
      activeStudents: $activeStudents,
      totalPracticeSessions: $totalPracticeSessions,
      averageAccuracy: round($averageAccuracy, 2),
    );
  }

  public function getStudentProgress(int $studentId): array
  {
    $practiceSessions = PracticeSession::where('user_id', $studentId)
      ->orderBy('practice_date', 'desc')
      ->limit(10)
      ->get();

    $gameScores = GameScore::where('user_id', $studentId)
      ->orderBy('created_at', 'desc')
      ->limit(10)
      ->get();

    $curriculumProgress = UserProgress::where('user_id', $studentId)
      ->with('curriculumStage')
      ->get();

    return [
      'recent_practice' => $practiceSessions,
      'recent_games' => $gameScores,
      'curriculum_progress' => $curriculumProgress,
    ];
  }

  public function getStudentAssignments(int $studentId): Collection
  {
    return Assignment::where('student_id', $studentId)
      ->with(['song', 'assignedBy'])
      ->orderBy('created_at', 'desc')
      ->get();
  }
}
