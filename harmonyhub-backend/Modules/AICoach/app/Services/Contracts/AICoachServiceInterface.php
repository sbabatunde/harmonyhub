<?php

namespace Modules\AICoach\app\Services\Contracts;

interface AICoachServiceInterface
{
  public function getFeedback(int $userId): array;
  public function getPracticeSummary(int $userId): array;
}
