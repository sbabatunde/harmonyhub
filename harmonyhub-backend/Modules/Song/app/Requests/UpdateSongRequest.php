<?php

namespace Modules\Song\app\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSongRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'title' => ['sometimes', 'string', 'max:255'],
      'artist' => ['nullable', 'string', 'max:255'],
      'key_signature' => ['nullable', 'string', 'max:10'],
      'tempo' => ['nullable', 'integer', 'min:20', 'max:300'],
      'difficulty_level' => ['nullable', 'integer', 'min:1', 'max:10'],
      'is_public_domain' => ['nullable', 'boolean'],
      'licensing_info' => ['nullable', 'string'],
    ];
  }
}
