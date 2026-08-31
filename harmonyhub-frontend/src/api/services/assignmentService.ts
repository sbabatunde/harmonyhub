import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { ApiResponse, Assignment } from '@/types';

export const assignmentService = {
  async getAssignments(): Promise<Assignment[]> {
    const response = await apiClient.get<ApiResponse<Assignment[]>>(
      API_ENDPOINTS.ASSIGNMENTS.LIST
    );
    return response.data;
  },

  async createAssignment(data: {
    student_id: number;
    song_id: number;
    due_date?: string;
  }): Promise<Assignment> {
    const response = await apiClient.post<ApiResponse<Assignment>>(
      API_ENDPOINTS.ASSIGNMENTS.CREATE,
      data
    );
    return response.data;
  },

  async completeAssignment(id: number): Promise<Assignment> {
    const response = await apiClient.post<ApiResponse<Assignment>>(
      API_ENDPOINTS.ASSIGNMENTS.COMPLETE(id)
    );
    return response.data;
  },
};