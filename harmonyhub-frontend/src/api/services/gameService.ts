import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { ApiResponse, GameScore } from '@/types';

export interface GameStatistics {
  pitch_perfect: {
    best_score: number;
    average_accuracy: number;
    games_played: number;
  };
  interval_trainer: {
    best_score: number;
    average_accuracy: number;
    games_played: number;
  };
  rhythm_master: {
    best_score: number;
    average_accuracy: number;
    games_played: number;
  };
}

export interface LeaderboardEntry {
  user_id: number;
  name: string;
  voice_part: string;
  best_score: number;
}

export const gameService = {
  async submitScore(data: {
    game_type: string;
    score: number;
    accuracy_percentage?: number;
  }): Promise<GameScore> {
    const response = await apiClient.post<ApiResponse<GameScore>>(
      API_ENDPOINTS.GAMES.SUBMIT_SCORE,
      data
    );
    return response.data;
  },

  async getUserScores(): Promise<GameScore[]> {
    const response = await apiClient.get<ApiResponse<GameScore[]>>(
      API_ENDPOINTS.GAMES.USER_SCORES
    );
    return response.data;
  },

  async getLeaderboard(gameType: string): Promise<LeaderboardEntry[]> {
    const response = await apiClient.get<ApiResponse<LeaderboardEntry[]>>(
      API_ENDPOINTS.GAMES.LEADERBOARD(gameType)
    );
    return response.data;
  },

  async getGameStatistics(): Promise<GameStatistics> {
    const response = await apiClient.get<ApiResponse<GameStatistics>>(
      '/games/statistics'
    );
    return response.data;
  },
};