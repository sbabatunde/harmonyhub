<?php

namespace Modules\Curriculum\App\Services\Contracts;

interface CurriculumServiceInterface
{
  public function getAllStages();
  public function getStage(int $stageId);
  public function getUserProgress(int $userId);
  public function updateUserProgress(int $userId, int $stageId);
}
