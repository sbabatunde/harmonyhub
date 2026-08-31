<?php

namespace Modules\Auth\app\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'name' => ['sometimes', 'string', 'max:255'],
      'voice_part' => ['sometimes', 'string', 'in:soprano,alto,tenor,bass,unknown'],
      'vocal_range_low' => ['sometimes', 'nullable', 'string', 'max:10'],
      'vocal_range_high' => ['sometimes', 'nullable', 'string', 'max:10'],
    ];
  }
}
