<?php

namespace Modules\Song\app\DTOs;

use Spatie\LaravelData\Data;

class CreateSongData extends Data
{
  public function __construct(
    public readonly string $title,
    public readonly int $churchId,
    public readonly int $createdBy,
    public readonly ?string $artist = null,
    public readonly ?string $keySignature = null,
    public readonly ?int $tempo = null,
    public readonly ?int $difficultyLevel = 1,
    public readonly ?bool $isPublicDomain = false,
    public readonly ?string $licensingInfo = null,
    public ?string $audioFilePath = null,
    public ?string $sheetMusicPath = null,
  ) {}
}
