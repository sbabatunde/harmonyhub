<?php

namespace Modules\Karaoke\App\Services;

use App\Models\KaraokeTrack;
use Illuminate\Support\Facades\Log;

class LyricsService
{
  /**
   * Update lyrics for a karaoke track.
   */
  public function updateLyrics(int $songId, mixed $lyricsInput, float $songDuration = 300): ?KaraokeTrack
  {
    $karaokeTrack = KaraokeTrack::where('song_id', $songId)->first();

    if (!$karaokeTrack) {
      return null;
    }

    // Parse lyrics from different input formats
    $lyrics = $this->parseLyricsInput($lyricsInput, $songDuration);

    if (empty($lyrics)) {
      Log::warning('No valid lyrics parsed', ['song_id' => $songId]);
      return null;
    }

    $karaokeTrack->update([
      'lyrics_data' => $lyrics,
    ]);

    return $karaokeTrack;
  }

  /**
   * Get current lyrics for a song.
   */
  public function getLyrics(int $songId): ?array
  {
    $karaokeTrack = KaraokeTrack::where('song_id', $songId)->first();
    return $karaokeTrack?->lyrics_data;
  }

  /**
   * Parse lyrics from different input formats.
   * Supports:
   * 1. Array of {start, end, text} - already synced
   * 2. Array of {text} - auto-distributed
   * 3. Array of strings - auto-distributed
   * 4. Raw text (newline separated) - auto-distributed
   */
  public function parseLyricsInput(mixed $input, float $songDuration): array
  {
    $lyrics = [];

    // Format 1: Array of {start, end, text}
    if (is_array($input) && isset($input[0]) && is_array($input[0]) && isset($input[0]['text'])) {
      // Check if timestamps are already provided
      if (isset($input[0]['start']) && is_numeric($input[0]['start'])) {
        Log::info('Lyrics already have timestamps');
        return $input;
      }

      // Auto-distribute: Array of {text} only
      $texts = array_column($input, 'text');
      $lyrics = $this->autoDistribute($texts, $songDuration);
    }
    // Format 2: Raw text (newline separated)
    elseif (is_string($input)) {
      $texts = array_filter(array_map('trim', explode("\n", $input)));
      $lyrics = $this->autoDistribute($texts, $songDuration);
    }
    // Format 3: Array of strings
    elseif (is_array($input) && isset($input[0]) && is_string($input[0])) {
      $texts = array_filter(array_map('trim', $input));
      $lyrics = $this->autoDistribute($texts, $songDuration);
    }

    return $lyrics;
  }

  /**
   * Distribute lyrics evenly across song duration.
   */
  public function autoDistribute(array $texts, float $songDuration): array
  {
    $lyrics = [];
    $count = count($texts);

    if ($count === 0) {
      return [];
    }

    $timePerLine = $songDuration / $count;

    foreach ($texts as $index => $text) {
      $lyrics[] = [
        'start' => round($index * $timePerLine, 2),
        'end' => round(($index + 1) * $timePerLine - 0.1, 2),
        'text' => $text,
      ];
    }

    return $lyrics;
  }
}
