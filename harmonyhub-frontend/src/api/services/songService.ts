import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { ApiResponse, Song, SongPart } from '@/types';
import { logger } from '@/utils/logger';

export const songService = {
  async getSongs(page = 1): Promise<Song[]> {
    // apiClient already unwraps AxiosResponse, so we get the ApiResponse envelope
    const response = await apiClient.get<ApiResponse<Song[]>>(
      API_ENDPOINTS.SONGS.LIST,
      { params: { page } }
    );
    
    logger.info('getSongs raw response', response);
    
    // response = { success: true, message: null, data: [...] }
    const responseData = response.data;
    
    if (Array.isArray(responseData)) {
      return responseData;
    }
    
    // Handle paginated: { success: true, data: { data: [...], current_page: 1 } }
    if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray((responseData as any).data)) {
      return (responseData as any).data;
    }
    
    return [];
  },

  async getSong(id: number): Promise<Song | null> {
    try {
      // apiClient returns the unwrapped body: { success, message, data: Song }
      const response = await apiClient.get<ApiResponse<Song>>(
        API_ENDPOINTS.SONGS.DETAIL(id)
      );
      
      logger.info('getSong raw response', { id, response });
      
      // The Song is at response.data (not response.data.data)
      const song = response.data;
      
      if (song && typeof song === 'object' && 'id' in song) {
        logger.info('Song found', song);
        return song;
      }
      
      logger.warn('No song data found', response);
      return null;
    } catch (error: any) {
      logger.error('Failed to fetch song', error as Error, {
        status: error.response?.status,
      });
      return null;
    }
  },

  async createSong(data: FormData): Promise<Song> {
    const response = await apiClient.post<ApiResponse<Song>>(
      API_ENDPOINTS.SONGS.CREATE,
      data
    );
    return response.data;
  },

  async updateSong(id: number, data: Partial<Song>): Promise<Song> {
    const response = await apiClient.put<ApiResponse<Song>>(
      API_ENDPOINTS.SONGS.UPDATE(id),
      data
    );
    return response.data;
  },

  async deleteSong(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.SONGS.DELETE(id));
  },

  async getSongParts(songId: number): Promise<SongPart[]> {
    const response = await apiClient.get<ApiResponse<SongPart[]>>(
      API_ENDPOINTS.SONGS.PARTS(songId)
    );
    return response.data || [];
  },

  async createSongPart(songId: number, data: FormData): Promise<SongPart> {
    const response = await apiClient.post<ApiResponse<SongPart>>(
      API_ENDPOINTS.SONGS.PARTS(songId),
      data
    );
    return response.data;
  },
};