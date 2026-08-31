<?php

namespace Modules\Game\app\Services\Contracts;

use Modules\Game\app\DTOs\SubmitScoreData;

interface GameServiceInterface
{
  public function submitScore(SubmitScoreData $data);
  public function getUserScores(int $userId);
  public function getChurchLeaderboard(int $churchId, string $gameType);
}
