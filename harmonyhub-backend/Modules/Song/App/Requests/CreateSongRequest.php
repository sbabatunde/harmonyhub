<?php

namespace Modules\Song\App\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;
use Modules\Song\App\DTOs\CreateSongData;

class CreateSongRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  protected function prepareForValidation(): void
  {
    if ($this->has('is_public_domain')) {
      $this->merge([
        'is_public_domain' => filter_var(
          $this->input('is_public_domain'),
          FILTER_VALIDATE_BOOLEAN,
          FILTER_NULL_ON_FAILURE
        ),
      ]);
    }
  }

  protected function failedValidation(Validator $validator)
  {
    $audioError = $this->file('audio_file')?->getError();
    if ($audioError && $audioError !== UPLOAD_ERR_OK) {
      $messages = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds upload_max_filesize.',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds MAX_FILE_SIZE in HTML form.',
        UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder.',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
        UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the upload.',
      ];
      $validator->errors()->add('audio_file', $messages[$audioError] ?? 'Unknown upload error.');
    }

    throw new ValidationException($validator);
  }

  public function rules(): array
  {
    return [
      'title' => ['required', 'string', 'max:255'],
      'artist' => ['nullable', 'string', 'max:255'],
      'key_signature' => ['nullable', 'string', 'max:10'],
      'tempo' => ['nullable', 'integer', 'min:20', 'max:300'],
      'difficulty_level' => ['nullable', 'integer', 'min:1', 'max:10'],
      'is_public_domain' => ['nullable', 'boolean'],
      'licensing_info' => ['nullable', 'string'],
      'audio_file' => ['nullable', 'file', 'mimes:mp3,wav,m4a,ogg', 'max:50000'],
      'sheet_music' => ['nullable', 'file', 'mimes:pdf', 'max:20000'],
    ];
  }

  public function toDTO(): CreateSongData
  {
    $validated = $this->validated();

    return new CreateSongData(
      title: $validated['title'],
      artist: $validated['artist'] ?? null,
      keySignature: $validated['key_signature'] ?? null,
      tempo: $validated['tempo'] ?? null,
      difficultyLevel: $validated['difficulty_level'] ?? 1,
      isPublicDomain: $validated['is_public_domain'] ?? false,
      licensingInfo: $validated['licensing_info'] ?? null,
      churchId: auth()->user()->church_id,
      createdBy: auth()->id(),
    );
  }
}
