<?php

namespace Modules\AICoach\App\Services;

use App\Models\PracticeSession;
use App\Models\GameScore;
use App\Models\UserProgress;
use Modules\AICoach\App\Services\Contracts\AICoachServiceInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AICoachService implements AICoachServiceInterface
{
  protected string $aiServiceUrl;

  public function __construct()
  {
    $this->aiServiceUrl = config('aicoach.ai_service_url', 'http://localhost:8001');
  }

  public function getPracticeSummary(int $userId): array
  {
    $totalSessions = PracticeSession::where('user_id', $userId)->count();
    $totalMinutes = PracticeSession::where('user_id', $userId)->sum('duration_minutes');
    $avgAccuracy = PracticeSession::where('user_id', $userId)
      ->whereNotNull('average_pitch_accuracy')
      ->avg('average_pitch_accuracy') ?? 0;

    // Calculate streak
    $streak = $this->calculateStreak($userId);

    // Game stats
    $gameStats = GameScore::where('user_id', $userId)
      ->selectRaw('game_type, COUNT(*) as games_played, MAX(score) as best_score')
      ->groupBy('game_type')
      ->get()
      ->pluck('games_played', 'game_type')
      ->toArray();

    // Recent practice
    $recentSongs = PracticeSession::where('user_id', $userId)
      ->whereHas('songPart.song')
      ->with('songPart.song')
      ->orderBy('practice_date', 'desc')
      ->limit(5)
      ->get()
      ->map(fn($session) => $session->songPart->song->title)
      ->unique()
      ->values()
      ->toArray();

    // Curriculum progress
    $curriculumProgress = UserProgress::where('user_id', $userId)
      ->with('curriculumStage')
      ->get()
      ->map(fn($progress) => [
        'stage' => $progress->curriculumStage->name,
        'status' => $progress->status,
        'accuracy' => $progress->accuracy_percentage,
      ])
      ->toArray();

    return [
      'total_sessions' => $totalSessions,
      'total_minutes' => $totalMinutes,
      'average_accuracy' => round($avgAccuracy, 2),
      'streak_days' => $streak,
      'games_played' => $gameStats,
      'recent_songs' => $recentSongs,
      'curriculum_progress' => $curriculumProgress,
    ];
  }

  public function getFeedback(int $userId): array
  {
    $practiceData = $this->getPracticeSummary($userId);

    try {
      $response = Http::timeout(60)->post("{$this->aiServiceUrl}/coach/feedback", [
        'user_id' => $userId,
        'practice_data' => $practiceData,
      ]);

      if ($response->successful()) {
        return $response->json();
      }
    } catch (\Exception $e) {
      Log::error('AI Coach request failed: ' . $e->getMessage());
    }

    // Fallback response
    return $this->generateFallbackFeedback($practiceData);
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

  private function generateFallbackFeedback(array $practiceData): array
  {
    return [
      'feedback' => "You've completed {$practiceData['total_sessions']} practice sessions with an average accuracy of {$practiceData['average_accuracy']}%.",
      'encouragement' => "Keep up the great work! Your dedication is showing.",
      'strengths' => ['Regular practice', 'Commitment to improvement'],
      'areas_to_improve' => ['Pitch accuracy', 'Practice consistency'],
      'suggestions' => [
        'Practice with Pitch Perfect game daily',
        'Focus on breath control',
        'Use loop feature for difficult sections',
      ],
      'next_steps' => [
        'Complete your next curriculum stage',
        'Practice for at least 15 minutes today',
      ],
    ];
  }
}
