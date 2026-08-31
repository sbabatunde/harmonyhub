import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { ApiResponse, PracticeSession } from '@/types';

export interface PracticeStatistics {
  total_sessions: number;
  total_minutes: number;
  average_accuracy: number;
  sessions_this_week: number;
  sessions_this_month: number;
  current_streak: number;
  top_songs: Array<{
    song_title: string;
    part_type: string;
    practice_count: number;
  }>;
  practice_by_day: Array<{
    practice_date: string;
    total_minutes: number;
  }>;
}

export const practiceService = {
  async getSessions(page = 1): Promise<ApiResponse<PracticeSession[]>> {
    const response = await apiClient.get<ApiResponse<PracticeSession[]>>(
      API_ENDPOINTS.PRACTICE.SESSIONS,
      { params: { page } }
    );
    return response;
  },

  async createSession(data: {
    song_part_id?: number | null;
    practice_date: string;
    duration_minutes: number;
    average_pitch_accuracy?: number | null;
    notes?: string;
  }): Promise<PracticeSession> {
    const response = await apiClient.post<ApiResponse<PracticeSession>>(
      API_ENDPOINTS.PRACTICE.SESSIONS,
      data
    );
    return response.data;
  },

  async getStatistics(): Promise<PracticeStatistics> {
    const response = await apiClient.get<ApiResponse<PracticeStatistics>>(
      API_ENDPOINTS.PRACTICE.STATISTICS
    );
    return response.data;
  },
};