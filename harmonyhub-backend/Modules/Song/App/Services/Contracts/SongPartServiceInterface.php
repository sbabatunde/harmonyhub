<?php

namespace Modules\Song\App\Services\Contracts;

use Modules\Song\App\DTOs\CreateSongPartData;
use Modules\Song\App\DTOs\SongPartData;
use Illuminate\Http\UploadedFile;

interface SongPartServiceInterface
{
  public function listParts(int $songId): array;
  public function createPart(CreateSongPartData $data): SongPartData;
  public function getPart(int $partId): ?SongPartData;
  public function updatePart(int $partId, array $data): ?SongPartData;
  public function deletePart(int $partId): bool;
  public function uploadAudioFile(UploadedFile $file, int $songId): string;
  public function uploadSheetMusic(UploadedFile $file, int $songId): string;
  public function uploadMidiFile(UploadedFile $file, int $songId): string;
}
