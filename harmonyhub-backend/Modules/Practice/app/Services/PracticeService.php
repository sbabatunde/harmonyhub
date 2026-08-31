<?php

namespace Modules\Practice\app\Services;

use App\Models\PracticeSession;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Modules\Practice\app\DTOs\CreatePracticeSessionData;
use Modules\Practice\app\Services\Contracts\PracticeServiceInterface;

class PracticeService implements PracticeServiceInterface
{
  public function listUserSessions(int $userId, int $perPage = 20)
  {
    return PracticeSession::where('user_id', $userId)
      ->with('songPart.song')
      ->orderBy('practice_date', 'desc')
      ->paginate($perPage);
  }

  public function createSession(CreatePracticeSessionData $data)
  {
    return PracticeSession::create([
      'user_id' => $data->userId,
      'song_part_id' => $data->songPartId,
      'practice_date' => $data->practiceDate,
      'duration_minutes' => $data->durationMinutes,
      'average_pitch_accuracy' => $data->averagePitchAccuracy,
      'notes' => $data->notes,
    ]);
  }

  public function getSession(int $sessionId)
  {
    return PracticeSession::with('songPart.song')->find($sessionId);
  }

  public function updateSession(int $sessionId, array $data)
  {
    $session = PracticeSession::find($sessionId);

    if (!$session) {
      return null;
    }

    $session->update($data);

    return $session->fresh();
  }

  public function deleteSession(int $sessionId): bool
  {
    return PracticeSession::destroy($sessionId) > 0;
  }


  public function getUserStatistics(int $userId): array
  {
    $totalSessions = PracticeSession::where('user_id', $userId)->count();
    $totalMinutes = PracticeSession::where('user_id', $userId)->sum('duration_minutes');
    $avgAccuracy = PracticeSession::where('user_id', $userId)
      ->whereNotNull('average_pitch_accuracy')
      ->avg('average_pitch_accuracy');

    // Weekly stats
    $thisWeek = PracticeSession::where('user_id', $userId)
      ->where('practice_date', '>=', Carbon::now()->startOfWeek())
      ->count();

    $thisMonth = PracticeSession::where('user_id', $userId)
      ->where('practice_date', '>=', Carbon::now()->startOfMonth())
      ->count();

    // Streak calculation
    $streak = $this->calculateStreak($userId);

    // Most practiced songs
    $topSongs = PracticeSession::where('user_id', $userId)
      ->whereHas('songPart.song')
      ->with('songPart.song')
      ->select('song_part_id', DB::raw('count(*) as practice_count'))
      ->groupBy('song_part_id')
      ->orderByDesc('practice_count')
      ->limit(5)
      ->get()
      ->map(function ($item) {
        return [
          'song_title' => $item->songPart->song->title,
          'part_type' => $item->songPart->part_type,
          'practice_count' => $item->practice_count,
        ];
      });

    // Practice by day (last 7 days)
    $practiceByDay = PracticeSession::where('user_id', $userId)
      ->where('practice_date', '>=', Carbon::now()->subDays(7))
      ->select('practice_date', DB::raw('sum(duration_minutes) as total_minutes'))
      ->groupBy('practice_date')
      ->orderBy('practice_date')
      ->get();

    return [
      'total_sessions' => $totalSessions,
      'total_minutes' => $totalMinutes,
      'average_accuracy' => round($avgAccuracy ?? 0, 2),
      'sessions_this_week' => $thisWeek,
      'sessions_this_month' => $thisMonth,
      'current_streak' => $streak,
      'top_songs' => $topSongs,
      'practice_by_day' => $practiceByDay,
    ];
  }

  private function calculateStreak(int $userId): int
  {
    $streak = 0;
    $date = Carbon::now();

    while (true) {
      $hasPractice = PracticeSession::where('user_id', $userId)
        ->whereDate('practice_date', $date->toDateString())
        ->exists();

      if ($hasPractice) {
        $streak++;
        $date->subDay();
      } else {
        break;
      }
    }

    return $streak;
  }
}
