<?php

namespace Modules\Song\App\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Song\App\Requests\CreateSongPartRequest;
use Modules\Song\App\Services\Contracts\SongPartServiceInterface;
use App\Support\Traits\ApiResponseTrait;

class SongPartController
{
  use ApiResponseTrait;

  public function __construct(
    private readonly SongPartServiceInterface $songPartService
  ) {}

  public function index(int $songId): JsonResponse
  {
    $parts = $this->songPartService->listParts($songId);

    return $this->successResponse($parts);
  }

  public function store(CreateSongPartRequest $request, int $songId): JsonResponse
  {
    $data = $request->toDTO();
    $data->songId = $songId;

    // Handle file uploads through service
    if ($request->hasFile('audio_file')) {
      $data->audioFilePath = $this->songPartService->uploadAudioFile(
        $request->file('audio_file'),
        $songId
      );
    }

    if ($request->hasFile('sheet_music')) {
      $data->sheetMusicPath = $this->songPartService->uploadSheetMusic(
        $request->file('sheet_music'),
        $songId
      );
    }

    if ($request->hasFile('midi_file')) {
      $data->midiFilePath = $this->songPartService->uploadMidiFile(
        $request->file('midi_file'),
        $songId
      );
    }

    $part = $this->songPartService->createPart($data);

    return $this->successResponse($part, 'Song part created successfully', 201);
  }

  public function show(int $songId, int $partId): JsonResponse
  {
    $part = $this->songPartService->getPart($partId);

    if (!$part) {
      return $this->errorResponse('Song part not found', 404);
    }

    return $this->successResponse($part);
  }

  public function update(int $songId, int $partId, CreateSongPartRequest $request): JsonResponse
  {
    $data = $request->validated();

    // Handle file uploads through service
    if ($request->hasFile('audio_file')) {
      $data['audio_file_path'] = $this->songPartService->uploadAudioFile(
        $request->file('audio_file'),
        $songId
      );
    }

    if ($request->hasFile('sheet_music')) {
      $data['sheet_music_path'] = $this->songPartService->uploadSheetMusic(
        $request->file('sheet_music'),
        $songId
      );
    }

    if ($request->hasFile('midi_file')) {
      $data['midi_file_path'] = $this->songPartService->uploadMidiFile(
        $request->file('midi_file'),
        $songId
      );
    }

    // Remove file objects
    unset($data['audio_file'], $data['sheet_music'], $data['midi_file']);

    $part = $this->songPartService->updatePart($partId, $data);

    if (!$part) {
      return $this->errorResponse('Song part not found', 404);
    }

    return $this->successResponse($part, 'Song part updated successfully');
  }

  public function destroy(int $songId, int $partId): JsonResponse
  {
    $deleted = $this->songPartService->deletePart($partId);

    if (!$deleted) {
      return $this->errorResponse('Song part not found', 404);
    }

    return $this->successResponse(null, 'Song part deleted successfully');
  }
}
