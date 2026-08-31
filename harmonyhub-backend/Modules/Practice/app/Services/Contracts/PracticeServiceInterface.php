<?php

namespace Modules\Practice\app\Services\Contracts;

use Modules\Practice\app\DTOs\CreatePracticeSessionData;

interface PracticeServiceInterface
{
  public function listUserSessions(int $userId, int $perPage = 20);
  public function createSession(CreatePracticeSessionData $data);
  public function getSession(int $sessionId);
  public function updateSession(int $sessionId, array $data);
  public function deleteSession(int $sessionId): bool;
  public function getUserStatistics(int $userId): array;
}
