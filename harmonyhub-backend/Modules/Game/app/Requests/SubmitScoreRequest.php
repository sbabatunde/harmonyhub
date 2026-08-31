<?php

namespace Modules\Game\app\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Game\app\DTOs\SubmitScoreData;

class SubmitScoreRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'game_type' => ['required', 'string', 'in:pitch_perfect,interval_trainer,rhythm_master'],
      'score' => ['required', 'integer', 'min:0'],
      'accuracy_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
    ];
  }

  public function toDTO(): SubmitScoreData
  {
    return SubmitScoreData::from([
      ...$this->validated(),
      'user_id' => auth()->id(),
    ]);
  }
}
