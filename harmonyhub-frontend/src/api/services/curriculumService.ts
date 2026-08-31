import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { ApiResponse, UserProgress, CurriculumStage } from '@/types';

export const curriculumService = {
  async getStages(): Promise<CurriculumStage[]> {
    const response = await apiClient.get<ApiResponse<CurriculumStage[]>>(
      API_ENDPOINTS.CURRICULUM.STAGES
    );
    return response.data;
  },

  async getProgress(): Promise<UserProgress[]> {
    const response = await apiClient.get<ApiResponse<UserProgress[]>>(
      API_ENDPOINTS.CURRICULUM.PROGRESS
    );
    return response.data;
  },

  async updateProgress(stageId: number): Promise<UserProgress> {
    const response = await apiClient.post<ApiResponse<UserProgress>>(
      API_ENDPOINTS.CURRICULUM.UPDATE_PROGRESS(stageId)
    );
    return response.data;
  },
};