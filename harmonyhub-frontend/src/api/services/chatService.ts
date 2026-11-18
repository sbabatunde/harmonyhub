import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  ChatMessage,
  ChatRoom,
  Paginated,
  VoicePresignResponse,
} from "@/types";

export const chatService = {
  async listRooms(): Promise<ChatRoom[]> {
    // Controller wraps: { data: ChatRoom[] } → apiClient unwraps one level
    const response = await apiClient.get<ApiResponse<ChatRoom[]>>(
      API_ENDPOINTS.CHAT.ROOMS,
    );
    return response.data;
  },

  async getRoom(roomId: number): Promise<ChatRoom> {
    const response = await apiClient.get<ApiResponse<ChatRoom>>(
      API_ENDPOINTS.CHAT.ROOM(roomId),
    );
    return response.data;
  },

  async createRoom(payload: {
    name?: string;
    is_group: boolean;
    member_ids: number[];
  }): Promise<ChatRoom> {
    const response = await apiClient.post<ApiResponse<ChatRoom>>(
      API_ENDPOINTS.CHAT.ROOMS,
      payload,
    );
    return response.data;
  },

  async listMessages(
    roomId: number,
    page = 1,
  ): Promise<Paginated<ChatMessage>> {
    // Controller returns the paginator UNWRAPPED (no successResponse),
    // so apiClient.get returns the paginator itself. Do NOT .data twice.
    return apiClient.get<Paginated<ChatMessage>>(
      `${API_ENDPOINTS.CHAT.MESSAGES(roomId)}?page=${page}`,
    );
  },

  async sendText(roomId: number, content: string): Promise<ChatMessage> {
    const response = await apiClient.post<ApiResponse<ChatMessage>>(
      API_ENDPOINTS.CHAT.MESSAGES(roomId),
      { content },
    );
    return response.data;
  },

  async markRead(roomId: number): Promise<void> {
    await apiClient.post(API_ENDPOINTS.CHAT.MARK_READ(roomId));
  },

  async notifyTyping(roomId: number, typing: boolean): Promise<void> {
    await apiClient.post(API_ENDPOINTS.CHAT.TYPING(roomId), { typing });
  },

  async presignVoiceUpload(
    roomId: number,
    mime: string,
    sizeBytes: number,
  ): Promise<VoicePresignResponse> {
    const response = await apiClient.post<ApiResponse<VoicePresignResponse>>(
      API_ENDPOINTS.CHAT.VOICE_PRESIGN(roomId),
      { mime, size_bytes: sizeBytes },
    );
    return response.data;
  },

  async attachVoice(
    roomId: number,
    payload: {
      voice_path: string;
      voice_duration_ms: number;
      voice_size_bytes: number;
    },
  ): Promise<ChatMessage> {
    const response = await apiClient.post<ApiResponse<ChatMessage>>(
      API_ENDPOINTS.CHAT.VOICE(roomId),
      payload,
    );
    return response.data;
  },

  async getVoiceUrl(roomId: number, messageId: number): Promise<string> {
    const response = await apiClient.get<{ url: string }>(
      API_ENDPOINTS.CHAT.VOICE_URL(roomId, messageId),
    );
    return response.url;
  },
};
