import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { ApiResponse, Assignment } from '@/types';

interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const assignmentService = {
  async getAssignments(): Promise<Assignment[]> {
    const response = await apiClient.get<ApiResponse<Paginated<Assignment>>>(
      API_ENDPOINTS.ASSIGNMENTS.LIST
    );
    return response.data.data;   // ✅ ApiResponse.data → Paginated → array
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
    return response.data;        // ✅ non-paginated, one unwrap is enough
  },

  async completeAssignment(id: number): Promise<Assignment> {
    const response = await apiClient.post<ApiResponse<Assignment>>(
      API_ENDPOINTS.ASSIGNMENTS.COMPLETE(id)
    );
    return response.data;        // ✅
  },
};