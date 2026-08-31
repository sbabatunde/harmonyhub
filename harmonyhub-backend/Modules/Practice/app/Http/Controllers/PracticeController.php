<?php

namespace Modules\Practice\app\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Practice\app\Requests\CreatePracticeSessionRequest;
use Modules\Practice\app\Services\Contracts\PracticeServiceInterface;
use App\Support\Traits\ApiResponseTrait;

class PracticeController
{
    use ApiResponseTrait;

    public function __construct(
        private readonly PracticeServiceInterface $practiceService
    ) {}

    public function index(): JsonResponse
    {
        $sessions = $this->practiceService->listUserSessions(auth()->id());

        return $this->successResponse($sessions);
    }

    public function store(CreatePracticeSessionRequest $request): JsonResponse
    {
        $session = $this->practiceService->createSession($request->toDTO());

        return $this->successResponse($session, 'Practice session logged successfully', 201);
    }

    public function show(int $id): JsonResponse
    {
        $session = $this->practiceService->getSession($id);

        if (!$session) {
            return $this->errorResponse('Practice session not found', 404);
        }

        return $this->successResponse($session);
    }

    public function update(int $id, CreatePracticeSessionRequest $request): JsonResponse
    {
        $session = $this->practiceService->updateSession($id, $request->validated());

        if (!$session) {
            return $this->errorResponse('Practice session not found', 404);
        }

        return $this->successResponse($session, 'Practice session updated successfully');
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->practiceService->deleteSession($id);

        if (!$deleted) {
            return $this->errorResponse('Practice session not found', 404);
        }

        return $this->successResponse(null, 'Practice session deleted successfully');
    }

    public function statistics(): JsonResponse
    {
        $stats = $this->practiceService->getUserStatistics(auth()->id());

        return $this->successResponse($stats);
    }
}
