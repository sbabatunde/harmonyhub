export const VOICE_PARTS = [
  { value: 'soprano', label: 'Soprano' },
  { value: 'alto', label: 'Alto' },
  { value: 'tenor', label: 'Tenor' },
  { value: 'bass', label: 'Bass' },
  { value: 'unknown', label: 'Unknown' },
] as const;

export const GAME_TYPES = [
  { value: 'pitch_perfect', label: 'Pitch Perfect' },
  { value: 'interval_trainer', label: 'Interval Trainer' },
  { value: 'rhythm_master', label: 'Rhythm Master' },
] as const;

export const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Intermediate' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Expert' },
] as const;