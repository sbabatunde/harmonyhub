<?php

namespace Modules\Karaoke\app\Services;

use App\Models\Song;
use App\Models\KaraokeTrack;
use App\Enums\KaraokeStatus;
use Modules\Karaoke\app\Services\Contracts\KaraokeServiceInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class KaraokeService implements KaraokeServiceInterface
{

  protected string $aiServiceUrl;
  protected string $webhookSecret;

  public function __construct()
  {
    $this->aiServiceUrl = config('karaoke.ai_service_url', 'http://localhost:8001');
    $this->webhookSecret = config('karaoke.webhook_secret', env('LARAVEL_WEBHOOK_SECRET', ''));
  }

  public function requestKaraokeProcessing(Song $song): KaraokeTrack
  {
    $karaokeTrack = KaraokeTrack::updateOrCreate(
      ['song_id' => $song->id],
      [
        'status' => KaraokeStatus::Pending->value,
        'error_message' => null,
      ]
    );

    if (!$song->audio_file_path) {
      $karaokeTrack->update([
        'status' => KaraokeStatus::Failed->value,
        'error_message' => 'Song has no audio file',
      ]);
      return $karaokeTrack;
    }

    try {
      // Check if AI service is alive
      $healthCheck = Http::timeout(3)->get("{$this->aiServiceUrl}/health");

      if (!$healthCheck->successful()) {
        $karaokeTrack->update([
          'status' => KaraokeStatus::Failed->value,
          'error_message' => 'AI service is not running. Please start it on port 8001.',
        ]);
        return $karaokeTrack;
      }

      $webhookUrl = url('/api/karaoke/webhook');
      $audioUrl = asset('storage/' . $song->audio_file_path);

      Log::info('Requesting karaoke processing', [
        'song_id' => $song->id,
        'audio_url' => $audioUrl,
        'webhook_url' => $webhookUrl,
      ]);

      // The AI service returns IMMEDIATELY with a task_id
      // It processes in the background and sends a webhook when done
      // So 10 seconds is more than enough for the initial response
      $response = Http::timeout(10)->post("{$this->aiServiceUrl}/karaoke/process", [
        'song_id' => $song->id,
        'audio_url' => $audioUrl,
        'callback_url' => $webhookUrl,
        'language' => 'en',
      ]);

      if ($response->successful()) {
        // The AI service accepted the request and will process in background
        $karaokeTrack->update([
          'status' => KaraokeStatus::Processing->value,
          'error_message' => null,
        ]);

        Log::info('Karaoke processing started', [
          'song_id' => $song->id,
          'task_id' => $response->json('task_id') ?? null,
        ]);
      } else {
        Log::error('AI service returned error', [
          'status' => $response->status(),
          'body' => $response->body(),
        ]);
        $karaokeTrack->update([
          'status' => KaraokeStatus::Failed->value,
          'error_message' => 'AI service returned error: ' . $response->status(),
        ]);
      }
    } catch (\Exception $e) {
      Log::error('Karaoke processing request failed: ' . $e->getMessage());
      $karaokeTrack->update([
        'status' => KaraokeStatus::Failed->value,
        'error_message' => 'Failed to connect to AI service: ' . $e->getMessage(),
      ]);
    }

    return $karaokeTrack;
  }

  public function getKaraokeStatus(int $songId): ?KaraokeTrack
  {
    $karaokeTrack = KaraokeTrack::where('song_id', $songId)->first();

    if ($karaokeTrack && $karaokeTrack->status === KaraokeStatus::Processing->value) {
      // Check if processing has been running too long (more than 15 minutes)
      $updatedAt = $karaokeTrack->updated_at;
      $now = now();

      if ($updatedAt && $updatedAt->diffInMinutes($now) > 15) {
        $karaokeTrack->update([
          'status' => KaraokeStatus::Failed->value,
          'error_message' => 'Processing timeout (15 minutes). Please retry.',
        ]);
        $karaokeTrack->refresh();
      }
    }

    return $karaokeTrack;
  }

  public function getKaraokeTrack(int $songId): ?KaraokeTrack
  {
    return KaraokeTrack::where('song_id', $songId)
      ->where('status', KaraokeStatus::Ready->value)
      ->first();
  }

  public function handleWebhook(array $data): void
  {
    $karaokeTrack = KaraokeTrack::where('song_id', $data['song_id'] ?? 0)->first();

    if (!$karaokeTrack) {
      return;
    }

    $karaokeTrack->update([
      'instrumental_file_path' => $data['instrumental_path'] ?? null,
      'vocal_file_path' => $data['vocal_path'] ?? null,
      'lyrics_data' => $data['lyrics'] ?? null,
      'status' => $data['status'] ?? 'failed',
      'error_message' => $data['error'] ?? null,
    ]);

    // Auto-create song parts from AI-generated parts
    if (isset($data['parts']) && is_array($data['parts'])) {
      foreach ($data['parts'] as $partType => $filePath) {
        \App\Models\SongPart::updateOrCreate(
          [
            'song_id' => $karaokeTrack->song_id,
            'part_type' => $partType,
          ],
          [
            'audio_file_path' => $filePath,
          ]
        );
      }
    }
  }
}
