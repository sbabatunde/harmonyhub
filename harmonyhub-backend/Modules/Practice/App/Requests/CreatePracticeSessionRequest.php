<?php

namespace Modules\Practice\App\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Practice\App\DTOs\CreatePracticeSessionData;

class CreatePracticeSessionRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'song_part_id' => ['nullable', 'exists:song_parts,id'],
      'practice_date' => ['required', 'date'],
      'duration_minutes' => ['required', 'integer', 'min:1', 'max:600'],
      'average_pitch_accuracy' => ['nullable', 'numeric', 'min:0', 'max:100'],
      'notes' => ['nullable', 'string', 'max:1000'],
    ];
  }

  public function toDTO(): CreatePracticeSessionData
  {
    return CreatePracticeSessionData::from([
      ...$this->validated(),
      'user_id' => auth()->id(),
    ]);
  }
}
