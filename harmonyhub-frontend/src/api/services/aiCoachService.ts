import apiClient from '../client';
import { ApiResponse } from '@/types';

export interface CoachFeedback {
  feedback: string;
  encouragement: string;
  strengths: string[];
  areas_to_improve: string[];
  suggestions: string[];
  next_steps: string[];
}

export const aiCoachService = {
  async getFeedback(): Promise<CoachFeedback> {
    const response = await apiClient.get<ApiResponse<CoachFeedback>>('/coach/feedback');
    return response.data;
  },

  async getSummary(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/coach/summary');
    return response.data;
  },
};