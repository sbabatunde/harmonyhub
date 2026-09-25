<?php

namespace Modules\Curriculum\App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Curriculum\App\Services\Contracts\CurriculumServiceInterface;
use App\Support\Traits\ApiResponseTrait;

class CurriculumController
{
    use ApiResponseTrait;

    public function __construct(
        private readonly CurriculumServiceInterface $curriculumService
    ) {}

    public function index(): JsonResponse
    {
        $stages = $this->curriculumService->getAllStages();

        return $this->successResponse($stages);
    }

    public function show(string $id): JsonResponse  // Change from int to string
    {
        $stage = $this->curriculumService->getStage((int) $id);  // Cast to int

        if (!$stage) {
            return $this->errorResponse('Curriculum stage not found', 404);
        }

        return $this->successResponse($stage);
    }



    public function userProgress(): JsonResponse
    {
        $progress = $this->curriculumService->getUserProgress(auth()->id());

        return $this->successResponse($progress);
    }

    public function updateProgress(string $stageId): JsonResponse  // Change from int to string
    {
        $progress = $this->curriculumService->updateUserProgress(
            auth()->id(),
            (int) $stageId  // Cast to int
        );

        return $this->successResponse($progress, 'Progress updated successfully');
    }
}
