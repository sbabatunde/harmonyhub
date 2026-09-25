<?php

namespace Modules\Game\App\Services;

use App\Models\GameScore;
use App\Models\User;
use Modules\Game\App\DTOs\SubmitScoreData;
use Modules\Game\App\Services\Contracts\GameServiceInterface;
use Illuminate\Support\Facades\DB;

class GameService implements GameServiceInterface
{
  public function submitScore(SubmitScoreData $data)
  {
    return GameScore::create([
      'user_id' => $data->userId,
      'game_type' => $data->gameType,
      'score' => $data->score,
      'accuracy_percentage' => $data->accuracyPercentage,
    ]);
  }

  public function getUserScores(int $userId)
  {
    return GameScore::where('user_id', $userId)
      ->orderBy('created_at', 'desc')
      ->paginate(20);
  }

  public function getChurchLeaderboard(int $churchId, string $gameType, int $limit = 10)
  {
    // Get best score per user
    return GameScore::where('game_type', $gameType)
      ->whereHas('user', function ($query) use ($churchId) {
        $query->where('church_id', $churchId);
      })
      ->with('user:id,name,voice_part')
      ->select('user_id', DB::raw('MAX(score) as best_score'))
      ->groupBy('user_id')
      ->orderByDesc('best_score')
      ->limit($limit)
      ->get()
      ->map(function ($score) {
        return [
          'user_id' => $score->user_id,
          'name' => $score->user->name,
          'voice_part' => $score->user->voice_part,
          'best_score' => $score->best_score,
        ];
      });
  }

  public function getGameStatistics(int $userId): array
  {
    $stats = [];

    foreach (['pitch_perfect', 'interval_trainer', 'rhythm_master'] as $gameType) {
      $bestScore = GameScore::where('user_id', $userId)
        ->where('game_type', $gameType)
        ->max('score');

      $avgAccuracy = GameScore::where('user_id', $userId)
        ->where('game_type', $gameType)
        ->whereNotNull('accuracy_percentage')
        ->avg('accuracy_percentage');

      $gamesPlayed = GameScore::where('user_id', $userId)
        ->where('game_type', $gameType)
        ->count();

      $stats[$gameType] = [
        'best_score' => $bestScore ?? 0,
        'average_accuracy' => round($avgAccuracy ?? 0, 2),
        'games_played' => $gamesPlayed,
      ];
    }

    return $stats;
  }
}
