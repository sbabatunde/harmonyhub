import apiClient from '../client';
import { ApiResponse } from '@/types';
import { logger } from '@/utils/logger';

export interface LyricLine {
  start: number;
  end: number;
  text: string;
}

export interface KaraokeTrack {
  id: number;
  song_id: number;
  instrumental_file_path?: string | null;
  vocal_file_path?: string | null;
  lyrics_data?: LyricLine[] | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  error_message?: string | null;
}

export const karaokeService = {
  async requestProcessing(songId: number): Promise<KaraokeTrack> {
    const response = await apiClient.post<ApiResponse<KaraokeTrack>>(
      `/songs/${songId}/karaoke/process`
    );
    return response.data;
  },

  async getStatus(songId: number): Promise<KaraokeTrack | null> {
    try {
      const response = await apiClient.get<ApiResponse<KaraokeTrack>>(
        `/songs/${songId}/karaoke/status`
      );
      return response.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getTrack(songId: number): Promise<KaraokeTrack | null> {
    try {
      const response = await apiClient.get<ApiResponse<KaraokeTrack>>(
        `/songs/${songId}/karaoke/track`
      );
      return response.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async updateLyrics(
    songId: number,
    lyrics: LyricLine[],
    songDuration?: number
  ): Promise<KaraokeTrack> {
    const response = await apiClient.put<ApiResponse<KaraokeTrack>>(
      `/songs/${songId}/karaoke/lyrics`,
      {
        lyrics,
        song_duration: songDuration,
      }
    );
    return response.data;
  },
};