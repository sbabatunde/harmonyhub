export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  voicePart?: string | null;
  vocalRangeLow?: string | null;
  vocalRangeHigh?: string | null;
  churchId?: number | null;
  churchName?: string | null;
}

export interface Song {
  id: number;
  title: string;
  artist?: string | null;
  keySignature?: string | null;
  tempo?: number | null;
  difficultyLevel: number;
  audioFilePath?: string | null;
  sheetMusicPath?: string | null;
  isPublicDomain: boolean;
  licensingInfo?: string | null;
  churchId: number;
  createdBy?: number | null;
  parts?: SongPart[] | null;
}

export interface SongPart {
  id: number;
  songId: number;
  partType: 'soprano' | 'alto' | 'tenor' | 'bass' | 'lead' | 'harmony';
  audioFilePath?: string | null;
  sheetMusicPath?: string | null;
  midiFilePath?: string | null;
}

export interface PracticeSession {
  id: number;
  userId: number;
  songPartId?: number | null;
  practiceDate: string;
  durationMinutes: number;
  averagePitchAccuracy?: number | null;
  notes?: string | null;
}

export interface CurriculumStage {
  id: number;
  order: number;
  name: string;
  description: string;
  requiredAccuracy: number;
}

export interface UserProgress {
  stage: CurriculumStage;
  status: 'locked' | 'in_progress' | 'completed';
  accuracy?: number;
}

export interface Assignment {
  id: number;
  studentId: number;
  songId: number;
  dueDate?: string | null;
  assignedBy: number;
  completedAt?: string | null;
  song?: Song;
}

export interface GameScore {
  id: number;
  userId: number;
  gameType: 'pitch_perfect' | 'interval_trainer' | 'rhythm_master';
  score: number;
  accuracyPercentage?: number | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data: T;
}