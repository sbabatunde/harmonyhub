<?php

namespace Modules\Song\App\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Song\App\Requests\CreateSongRequest;
use Modules\Song\App\Requests\UpdateSongRequest;
use Modules\Song\App\Services\Contracts\SongServiceInterface;
use App\Support\Traits\ApiResponseTrait;

class SongController
{
    use ApiResponseTrait;

    public function __construct(
        private readonly SongServiceInterface $songService
    ) {}

    public function index(): JsonResponse
    {
        $songs = $this->songService->listSongs(auth()->user()->church_id);

        return $this->successResponse($songs);
    }

    public function store(CreateSongRequest $request): JsonResponse
    {
        $data = $request->toDTO();

        // Handle file uploads through service
        if ($request->hasFile('audio_file')) {
            $data->audioFilePath = $this->songService->uploadAudioFile(
                $request->file('audio_file')
            );
        }

        if ($request->hasFile('sheet_music')) {
            $data->sheetMusicPath = $this->songService->uploadSheetMusic(
                $request->file('sheet_music')
            );
        }

        $song = $this->songService->createSong($data);

        return $this->successResponse($song, 'Song created successfully', 201);
    }

    public function show(int $id): JsonResponse
    {
        $song = $this->songService->getSong($id);

        if (!$song) {
            return $this->errorResponse('Song not found', 404);
        }

        return $this->successResponse($song);
    }

    public function update(UpdateSongRequest $request, int $id): JsonResponse
    {
        $data = $request->validated();

        // Handle file uploads through service
        if ($request->hasFile('audio_file')) {
            $data['audio_file_path'] = $this->songService->uploadAudioFile(
                $request->file('audio_file')
            );
        }

        if ($request->hasFile('sheet_music')) {
            $data['sheet_music_path'] = $this->songService->uploadSheetMusic(
                $request->file('sheet_music')
            );
        }

        // Remove file objects from data
        unset($data['audio_file'], $data['sheet_music']);

        $song = $this->songService->updateSong($id, $data);

        if (!$song) {
            return $this->errorResponse('Song not found', 404);
        }

        return $this->successResponse($song, 'Song updated successfully');
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->songService->deleteSong($id);

        if (!$deleted) {
            return $this->errorResponse('Song not found', 404);
        }

        return $this->successResponse(null, 'Song deleted successfully');
    }
}
