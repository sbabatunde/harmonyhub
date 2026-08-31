<?php

namespace Modules\Song\app\DTOs;

use Spatie\LaravelData\Data;

class CreateSongPartData extends Data
{
  public function __construct(
    public readonly string $partType,
    public int $songId,
    public readonly ?string $audioFilePath = null,
    public readonly ?string $sheetMusicPath = null,
    public readonly ?string $midiFilePath = null,
  ) {}
}
