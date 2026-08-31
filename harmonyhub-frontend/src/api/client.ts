// src/api/client.ts
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { api } from '@/config/api';

/**
 * Thin convenience wrapper around the single shared axios instance in
 * config/api.ts — NOT a second axios.create(). That was the bug: this file
 * used to spin up its own instance with no XSRF interceptor, so every
 * request through apiClient (songService, authService, etc.) went out
 * with no X-XSRF-TOKEN header at all, and Laravel returned 419.
 *
 * All CSRF handling, the 419-retry-once logic, and the guarded 401 redirect
 * now live in exactly one place: config/api.ts. This class just unwraps
 * `.data` for callers that expect T instead of AxiosResponse<T>.
 */
class ApiClient {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await api.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await api.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await api.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await api.delete(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;