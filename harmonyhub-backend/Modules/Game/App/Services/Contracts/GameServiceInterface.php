<?php

namespace Modules\Game\App\Services\Contracts;

use Modules\Game\App\DTOs\SubmitScoreData;

interface GameServiceInterface
{
  public function submitScore(SubmitScoreData $data);
  public function getUserScores(int $userId);
  public function getChurchLeaderboard(int $churchId, string $gameType);
}
