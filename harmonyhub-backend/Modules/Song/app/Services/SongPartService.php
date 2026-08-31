<?php

namespace Modules\Song\app\Services;

use App\Enums\SongPartType;
use App\Models\SongPart;
use App\Support\Services\Contracts\FileUploadServiceInterface;
use Illuminate\Http\UploadedFile;
use Modules\Song\app\DTOs\CreateSongPartData;
use Modules\Song\app\DTOs\SongPartData;
use Modules\Song\app\Services\Contracts\SongPartServiceInterface;

class SongPartService implements SongPartServiceInterface
{
  public function __construct(
    private readonly FileUploadServiceInterface $fileUploadService
  ) {}

  public function listParts(int $songId): array
  {
    return SongPart::where('song_id', $songId)
      ->get()
      ->map(fn($part) => SongPartData::fromModel($part))
      ->toArray();
  }

  public function createPart(CreateSongPartData $data): SongPartData
  {
    $part = SongPart::create([
      'song_id' => $data->songId,
      'part_type' => $data->partType instanceof SongPartType
        ? $data->partType->value
        : $data->partType,
      'audio_file_path' => $data->audioFilePath,
      'sheet_music_path' => $data->sheetMusicPath,
      'midi_file_path' => $data->midiFilePath,
    ]);

    return SongPartData::fromModel($part);
  }

  public function getPart(int $partId): ?SongPartData
  {
    $part = SongPart::find($partId);
    return $part ? SongPartData::fromModel($part) : null;
  }

  public function updatePart(int $partId, array $data): ?SongPartData
  {
    $part = SongPart::find($partId);

    if (!$part) {
      return null;
    }

    // Handle file deletions if new files are uploaded
    if (isset($data['audio_file']) && $part->audio_file_path) {
      $this->fileUploadService->delete($part->audio_file_path);
    }

    if (isset($data['sheet_music']) && $part->sheet_music_path) {
      $this->fileUploadService->delete($part->sheet_music_path);
    }

    if (isset($data['midi_file']) && $part->midi_file_path) {
      $this->fileUploadService->delete($part->midi_file_path);
    }

    // Remove file objects before updating
    unset($data['audio_file'], $data['sheet_music'], $data['midi_file']);

    $part->update($data);

    return SongPartData::fromModel($part->fresh());
  }

  public function deletePart(int $partId): bool
  {
    $part = SongPart::find($partId);

    if (!$part) {
      return false;
    }

    // Delete associated files
    if ($part->audio_file_path) {
      $this->fileUploadService->delete($part->audio_file_path);
    }

    if ($part->sheet_music_path) {
      $this->fileUploadService->delete($part->sheet_music_path);
    }

    if ($part->midi_file_path) {
      $this->fileUploadService->delete($part->midi_file_path);
    }

    return $part->delete();
  }

  /**
   * Upload audio file for a part.
   */
  public function uploadAudioFile(UploadedFile $file, int $songId): string
  {
    return $this->fileUploadService->upload($file, "songs/{$songId}/parts/audio");
  }

  /**
   * Upload sheet music for a part.
   */
  public function uploadSheetMusic(UploadedFile $file, int $songId): string
  {
    return $this->fileUploadService->upload($file, "songs/{$songId}/parts/sheets");
  }

  /**
   * Upload MIDI file for a part.
   */
  public function uploadMidiFile(UploadedFile $file, int $songId): string
  {
    return $this->fileUploadService->upload($file, "songs/{$songId}/parts/midi");
  }
}
