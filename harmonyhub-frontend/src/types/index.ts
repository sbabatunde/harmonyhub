export interface User {
  id: number;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  voicePart?: string | null;
  vocalRangeLow?: string | null;
  vocalRangeHigh?: string | null;
  churchId?: number | null;
  churchName?: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SongPart {
  id: number;
  songId: number;
  partType: string;
  audioFilePath?: string | null;
  sheetMusicPath?: string | null;
  midiFilePath?: string | null;
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

export interface Assignment {
  id: number;
  studentId: number;
  songId: number;
  dueDate?: string | null;
  assignedBy: number;
  completedAt?: string | null;
  song?: Song;
  student?: User;
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
  status: "locked" | "in_progress" | "completed";
  accuracy?: number;
}

export interface GameScore {
  id: number;
  userId: number;
  gameType: "pitch_perfect" | "interval_trainer" | "rhythm_master";
  score: number;
  accuracyPercentage?: number | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data: T;
}

// ---- Chat ----

export type UserRole = "student" | "teacher" | "admin";

export interface ChatRoomMember {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  voice_part: string | null;
  last_seen_at: string | null;
}

export interface ChatSongRef {
  id: number;
  title: string;
  artist: string | null;
}

export interface ChatReplyRef {
  id: number;
  sender_name: string | null;
  content: string | null;
  type: ChatMessageType;
}

export interface ChatForwardRef {
  id: number;
  sender_name: string | null;
}

export type ChatMessageType = "text" | "voice";

export interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name: string | null;
  type: ChatMessageType;
  content: string | null;
  voice_path: string | null;
  voice_duration_ms: number | null;
  voice_size_bytes: number | null;
  edited_at: string | null;
  pinned_at: string | null;
  pinned_by: number | null;
  deleted_at: string | null;
  created_at: string;
  reply_to: ChatReplyRef | null;
  forwarded_from: ChatForwardRef | null;
  song: ChatSongRef | null;
}

export interface ChatRoom {
  id: number;
  name: string | null;
  is_group: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  members: ChatRoomMember[];
  latest_message: ChatMessage | null;
  unread_count: number;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface VoicePresignResponse {
  key: string;
  upload_url: string;
  headers: Record<string, string>;
}
