<?php

namespace Modules\AICoach\App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\AICoach\App\Services\Contracts\AICoachServiceInterface;
use App\Support\Traits\ApiResponseTrait;

class AICoachController
{
    use ApiResponseTrait;

    public function __construct(
        private readonly AICoachServiceInterface $aiCoachService
    ) {}

    public function getFeedback(): JsonResponse
    {
        $feedback = $this->aiCoachService->getFeedback(auth()->id());
        return $this->successResponse($feedback);
    }

    public function getSummary(): JsonResponse
    {
        $summary = $this->aiCoachService->getPracticeSummary(auth()->id());
        return $this->successResponse($summary);
    }
}
