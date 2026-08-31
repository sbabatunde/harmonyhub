<?php

namespace Modules\Teacher\app\DTOs;

use Spatie\LaravelData\Data;
use App\Models\User;

class StudentData extends Data
{
  public function __construct(
    public readonly int $id,
    public readonly string $name,
    public readonly string $email,
    public readonly ?string $voicePart,
    public readonly ?string $vocalRangeLow,
    public readonly ?string $vocalRangeHigh,
    public readonly ?string $ageBracket,
    public readonly bool $isMinor,
    public readonly ?string $guardianEmail,
    public readonly ?int $practiceSessionsCount,
    public readonly ?float $averageAccuracy,
  ) {}

  public static function fromModel(User $user): self
  {
    return new self(
      id: $user->id,
      name: $user->name,
      email: $user->email,
      voicePart: $user->voice_part ? $user->voice_part->value ?? $user->voice_part : null,
      vocalRangeLow: $user->vocal_range_low,
      vocalRangeHigh: $user->vocal_range_high,
      ageBracket: $user->age_bracket,
      isMinor: (bool) $user->is_minor,
      guardianEmail: $user->guardian_email,
      practiceSessionsCount: $user->practice_sessions_count ?? 0,
      averageAccuracy: $user->average_accuracy ? round($user->average_accuracy, 2) : null,
    );
  }
}
