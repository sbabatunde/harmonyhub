<?php

namespace Modules\Karaoke\App\Http\Controllers;

use App\Models\Song;
use App\Support\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Karaoke\App\Services\Contracts\KaraokeServiceInterface;
use Modules\Karaoke\App\Services\LyricsService;

class KaraokeController
{
    use ApiResponseTrait;

    public function __construct(
        private readonly KaraokeServiceInterface $karaokeService,
        private readonly LyricsService $lyricsService
    ) {}

    public function requestProcessing(int $songId): JsonResponse
    {
        $song = Song::find($songId);

        if (!$song) {
            return $this->errorResponse('Song not found', 404);
        }

        $karaokeTrack = $this->karaokeService->requestKaraokeProcessing($song);

        return $this->successResponse($karaokeTrack, 'Karaoke processing requested');
    }

    public function status(int $songId): JsonResponse
    {
        $karaokeTrack = $this->karaokeService->getKaraokeStatus($songId);

        if (!$karaokeTrack) {
            return $this->errorResponse('No karaoke track found for this song', 404);
        }

        return $this->successResponse($karaokeTrack);
    }

    public function getTrack(int $songId): JsonResponse
    {
        $karaokeTrack = $this->karaokeService->getKaraokeTrack($songId);

        if (!$karaokeTrack) {
            return $this->errorResponse('No ready karaoke track found', 404);
        }

        return $this->successResponse($karaokeTrack);
    }

    public function webhook(Request $request): JsonResponse
    {
        $this->karaokeService->handleWebhook($request->all());

        return $this->successResponse(null, 'Webhook processed');
    }

    public function updateLyrics(int $songId, Request $request): JsonResponse
    {
        $lyricsInput = $request->input('lyrics');
        $songDuration = (float) $request->input('song_duration', 300);

        $karaokeTrack = $this->lyricsService->updateLyrics($songId, $lyricsInput, $songDuration);

        if (!$karaokeTrack) {
            return $this->errorResponse('Failed to update lyrics', 422);
        }

        return $this->successResponse($karaokeTrack, 'Lyrics updated successfully');
    }
}
