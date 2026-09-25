<?php

namespace Modules\Song\App\Services;

use App\Models\Song;
use App\Support\Services\Contracts\FileUploadServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Song\App\DTOs\CreateSongData;
use Modules\Song\App\DTOs\SongData;
use Modules\Song\App\Services\Contracts\SongServiceInterface;

class SongService implements SongServiceInterface
{
  public function __construct(
    private readonly FileUploadServiceInterface $fileUploadService
  ) {}

  public function listSongs(int $churchId, int $perPage = 20): LengthAwarePaginator
  {
    return Song::where('church_id', $churchId)
      ->with(['parts', 'karaokeTrack'])
      ->paginate($perPage);
  }

  public function createSong(CreateSongData $data): SongData
  {
    $song = Song::create([
      'title' => $data->title,
      'artist' => $data->artist,
      'key_signature' => $data->keySignature,
      'tempo' => $data->tempo,
      'difficulty_level' => $data->difficultyLevel ?? 1,
      'is_public_domain' => $data->isPublicDomain ?? false,
      'licensing_info' => $data->licensingInfo,
      'created_by' => $data->createdBy,
      'church_id' => $data->churchId,
      'audio_file_path' => $data->audioFilePath,
      'sheet_music_path' => $data->sheetMusicPath,
    ]);

    return SongData::fromModel($song);
  }

  public function getSong(int $songId): ?SongData
  {
    $song = Song::with(['parts', 'karaokeTrack', 'createdBy'])
      ->find($songId);

    return $song ? SongData::fromModel($song) : null;
  }

  public function updateSong(int $songId, array $data): ?SongData
  {
    $song = Song::find($songId);

    if (!$song) {
      return null;
    }

    // Handle file deletions if new files are being uploaded
    if (isset($data['audio_file']) && $song->audio_file_path) {
      $this->fileUploadService->delete($song->audio_file_path);
    }

    if (isset($data['sheet_music']) && $song->sheet_music_path) {
      $this->fileUploadService->delete($song->sheet_music_path);
    }

    // Remove file objects before updating
    unset($data['audio_file'], $data['sheet_music']);

    $song->update($data);

    return SongData::fromModel($song->fresh());
  }

  public function deleteSong(int $songId): bool
  {
    $song = Song::find($songId);

    if (!$song) {
      return false;
    }

    // Delete associated files
    if ($song->audio_file_path) {
      $this->fileUploadService->delete($song->audio_file_path);
    }

    if ($song->sheet_music_path) {
      $this->fileUploadService->delete($song->sheet_music_path);
    }

    return $song->delete();
  }

  /**
   * Upload and store audio file.
   */
  public function uploadAudioFile(UploadedFile $file): string
  {
    return $this->fileUploadService->upload($file, 'songs/audio');
  }

  /**
   * Upload and store sheet music file.
   */
  public function uploadSheetMusic(UploadedFile $file): string
  {
    return $this->fileUploadService->upload($file, 'songs/sheets');
  }
}
