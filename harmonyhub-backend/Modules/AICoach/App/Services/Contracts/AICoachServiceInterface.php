<?php

namespace Modules\AICoach\App\Services\Contracts;

interface AICoachServiceInterface
{
  public function getFeedback(int $userId): array;
  public function getPracticeSummary(int $userId): array;
}
