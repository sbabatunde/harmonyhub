<?php

namespace Modules\Karaoke\App\DTOs;

use App\Enums\KaraokeStatus;
use App\Models\KaraokeTrack;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelData\Data;

class KaraokeTrackData extends Data
{
  public function __construct(
    public readonly int $id,
    public readonly int $songId,
    public readonly ?string $instrumentalFilePath,
    public readonly ?string $vocalFilePath,
    public readonly ?array $lyricsData,
    public readonly string $status,
    public readonly ?string $errorMessage,
    public readonly ?string $createdAt,
    public readonly ?string $updatedAt,
  ) {}

  public static function fromModel(KaraokeTrack $track): self
  {
    $disk = Storage::disk(config('filesystems.default'));

    return new self(
      id: $track->id,
      songId: $track->song_id,
      instrumentalFilePath: $track->instrumental_file_path
        ? $disk->url($track->instrumental_file_path)
        : null,
      vocalFilePath: $track->vocal_file_path
        ? $disk->url($track->vocal_file_path)
        : null,
      lyricsData: $track->lyrics_data,
      status: $track->status instanceof KaraokeStatus
        ? $track->status->value
        : (string) $track->status,
      errorMessage: $track->error_message,
      createdAt: $track->created_at?->toIso8601String(),
      updatedAt: $track->updated_at?->toIso8601String(),
    );
  }
}