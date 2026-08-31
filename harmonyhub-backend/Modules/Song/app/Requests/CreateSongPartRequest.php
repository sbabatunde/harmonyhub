<?php

namespace Modules\Song\app\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Song\app\DTOs\CreateSongPartData;

class CreateSongPartRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'part_type' => ['required', 'string', 'in:soprano,alto,tenor,bass,lead,harmony'],
      'audio_file' => ['nullable', 'file', 'mimes:mp3,wav,m4a', 'max:20480'],
      'sheet_music' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
      'midi_file' => ['nullable', 'file', 'mimes:mid,midi', 'max:2048'],
    ];
  }

  public function toDTO(): CreateSongPartData
  {
    return CreateSongPartData::from([
      ...$this->validated(),
      'song_id' => $this->route('songId'),
    ]);
  }
}
