<?php

namespace Modules\Song\app\Services\Contracts;

use Modules\Song\app\DTOs\CreateSongData;
use Modules\Song\app\DTOs\SongData;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;

interface SongServiceInterface
{
  public function listSongs(int $churchId, int $perPage = 20): LengthAwarePaginator;
  public function createSong(CreateSongData $data): SongData;
  public function getSong(int $songId): ?SongData;
  public function updateSong(int $songId, array $data): ?SongData;
  public function deleteSong(int $songId): bool;
  public function uploadAudioFile(UploadedFile $file): string;
  public function uploadSheetMusic(UploadedFile $file): string;
}
