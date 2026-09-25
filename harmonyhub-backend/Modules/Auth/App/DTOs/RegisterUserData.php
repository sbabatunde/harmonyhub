<?php

namespace Modules\Auth\App\DTOs;

use Spatie\LaravelData\Data;

class RegisterUserData extends Data
{
  public function __construct(
    public readonly string $name,
    public readonly string $email,
    public readonly string $password,
    public readonly int $churchId,
    public readonly ?string $voicePart = 'unknown',
    public readonly ?string $vocalRangeLow = null,
    public readonly ?string $vocalRangeHigh = null,
    public readonly ?string $ageBracket = null,
    public readonly ?bool $isMinor = false,
    public readonly ?string $guardianEmail = null,
  ) {}
}
