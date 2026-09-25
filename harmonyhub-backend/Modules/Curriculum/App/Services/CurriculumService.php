<?php

namespace Modules\Curriculum\App\Services;

use App\Models\CurriculumStage;
use App\Models\UserProgress;
use App\Enums\ProgressStatus;
use Modules\Curriculum\App\Services\Contracts\CurriculumServiceInterface;

class CurriculumService implements CurriculumServiceInterface
{
  public function getAllStages()
  {
    return CurriculumStage::orderBy('order')->get();
  }

  public function getStage(int $stageId)
  {
    return CurriculumStage::find($stageId);
  }

  public function getUserProgress(int $userId)
  {
    $stages = CurriculumStage::orderBy('order')->get();
    $progress = UserProgress::where('user_id', $userId)->get();

    return $stages->map(function ($stage) use ($progress) {
      $userProgress = $progress->firstWhere('curriculum_stage_id', $stage->id);

      return [
        'stage' => $stage,
        'status' => $userProgress?->status ?? 'locked',
        'accuracy' => $userProgress?->accuracy_percentage,
        'unlocked_at' => $userProgress?->unlocked_at,
        'completed_at' => $userProgress?->completed_at,
      ];
    });
  }

  public function updateUserProgress(int $userId, int $stageId)
  {
    $stage = CurriculumStage::findOrFail($stageId);

    $progress = UserProgress::updateOrCreate(
      [
        'user_id' => $userId,
        'curriculum_stage_id' => $stageId,
      ],
      [
        'status' => ProgressStatus::InProgress->value,
        'unlocked_at' => now(),
      ]
    );

    return $progress;
  }
}
