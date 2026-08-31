<?php

namespace Modules\Song\app\DTOs;

use Spatie\LaravelData\Data;
use App\Models\SongPart;
use App\Enums\SongPartType;

class SongPartData extends Data
{
  public function __construct(
    public readonly int $id,
    public readonly int $songId,
    public readonly SongPartType|string $partType,  // Accept both enum and string
    public readonly ?string $audioFilePath,
    public readonly ?string $sheetMusicPath,
    public readonly ?string $midiFilePath,
  ) {}

  public static function fromModel(SongPart $part): self
  {
    return new self(
      id: $part->id,
      songId: $part->song_id,
      partType: $part->part_type instanceof SongPartType
        ? $part->part_type->value
        : $part->part_type,
      audioFilePath: $part->audio_file_path,
      sheetMusicPath: $part->sheet_music_path,
      midiFilePath: $part->midi_file_path,
    );
  }
}
