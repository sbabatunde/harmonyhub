import apiClient from "../client";
import { ApiResponse } from "@/types";

export interface Student {
  id: number;
  name: string;
  email: string;
  voicePart?: string;
  vocalRangeLow?: string;
  vocalRangeHigh?: string;
  ageBracket?: string;
  isMinor: boolean;
  guardianEmail?: string;
  practiceSessionsCount?: number;
  averageAccuracy?: number;
}

export interface TeacherStats {
  totalStudents: number;
  activeStudents: number;
  totalPracticeSessions: number;
  averageAccuracy: number;
}

export const teacherService = {
  async getStudents(): Promise<Student[]> {
    const response =
      await apiClient.get<ApiResponse<Student[]>>("/teacher/students");
    return response.data;
  },

  async getStudentDetails(studentId: number): Promise<Student> {
    const response = await apiClient.get<ApiResponse<Student>>(
      `/teacher/students/${studentId}`,
    );
    return response.data;
  },

  async getStatistics(): Promise<TeacherStats> {
    const response = await apiClient.get<ApiResponse<TeacherStats>>(
      "/teacher/statistics",
    );
    return response.data;
  },

  async getStudentProgress(studentId: number): Promise<any> {
    const response = await apiClient.get<ApiResponse<Student>>(
      `/teacher/students/${studentId}/progress`,
    );
    return response.data;
  },

  async getStudentAssignments(studentId: number): Promise<any> {
    const response = await apiClient.get<ApiResponse<Student>>(
      `/teacher/students/${studentId}/assignments`,
    );
    return response.data;
  },
};
