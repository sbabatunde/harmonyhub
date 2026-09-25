<?php

namespace Modules\Game\App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Game\App\Requests\SubmitScoreRequest;
use Modules\Game\App\Services\Contracts\GameServiceInterface;
use App\Support\Traits\ApiResponseTrait;

class GameController
{
    use ApiResponseTrait;

    public function __construct(
        private readonly GameServiceInterface $gameService
    ) {}

    public function submitScore(SubmitScoreRequest $request): JsonResponse
    {
        $score = $this->gameService->submitScore($request->toDTO());

        return $this->successResponse($score, 'Score submitted successfully', 201);
    }

    public function userScores(): JsonResponse
    {
        $scores = $this->gameService->getUserScores(auth()->id());

        return $this->successResponse($scores);
    }

    public function leaderboard(string $gameType): JsonResponse
    {
        $leaderboard = $this->gameService->getChurchLeaderboard(
            auth()->user()->church_id,
            $gameType
        );

        return $this->successResponse($leaderboard);
    }
}
