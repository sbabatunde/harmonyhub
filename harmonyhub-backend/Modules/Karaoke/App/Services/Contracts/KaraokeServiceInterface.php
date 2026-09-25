<?php

namespace Modules\Karaoke\App\Services\Contracts;

use App\Models\Song;
use App\Models\KaraokeTrack;

interface KaraokeServiceInterface
{
  public function requestKaraokeProcessing(Song $song): KaraokeTrack;
  public function getKaraokeStatus(int $songId): ?KaraokeTrack;
  public function handleWebhook(array $data): void;
  public function getKaraokeTrack(int $songId): ?KaraokeTrack;
}
