<?php

namespace Modules\Song\App\DTOs;

use App\Models\Song;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelData\Data;

class SongData extends Data
{
  public function __construct(
    public readonly int $id,
    public readonly string $title,
    public readonly ?string $artist,
    public readonly ?string $keySignature,
    public readonly ?int $tempo,
    public readonly int $difficultyLevel,
    public readonly ?string $audioFilePath,
    public readonly ?string $sheetMusicPath,
    public readonly bool $isPublicDomain,
    public readonly ?string $licensingInfo,
    public readonly int $churchId,
    public readonly ?int $createdBy,
    public readonly ?array $parts = null,
  ) {}

  public static function fromModel(Song $song): self
  {
    return new self(
      id: $song->id,
      title: $song->title,
      artist: $song->artist,
      keySignature: $song->key_signature,  // camelCase
      tempo: $song->tempo,
      difficultyLevel: $song->difficulty_level,  // camelCase
      audioFilePath: $song->audio_file_path   ? Storage::disk(config('filesystems.default'))->url($song->audio_file_path)
        : null,
      sheetMusicPath: $song->sheet_music_path,  // camelCase
      isPublicDomain: (bool) $song->is_public_domain,  // camelCase
      licensingInfo: $song->licensing_info,
      churchId: $song->church_id,  // camelCase
      createdBy: $song->created_by,  // camelCase
      parts: $song->parts ? SongPartData::collect($song->parts)->toArray() : null,
    );
  }
}
