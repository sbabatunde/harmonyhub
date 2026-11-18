import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/api/services/chatService";
import { echo } from "@/lib/echo";
import type { ChatMessage, Paginated } from "@/types";

const messageKey = (roomId: number) => ["chat", "messages", roomId];

interface MessageSentPayload {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name: string;
  type: "text" | "voice";
  content: string | null;
  voice_path: string | null;
  voice_duration_ms: number | null;
  voice_size_bytes: number | null;
  created_at: string;
}

type MessagesCache = Paginated<ChatMessage>;

export function useChatMessages(roomId: number | null) {
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof echo.private> | null>(null);

  const messagesQuery = useQuery({
    queryKey: messageKey(roomId ?? 0),
    queryFn: () => chatService.listMessages(roomId as number),
    enabled: !!roomId,
    staleTime: 10_000,
  });

  // Subscribe to realtime events
  useEffect(() => {
    if (!roomId) return;

    const channel = echo.private(`chat.room.${roomId}`);
    channelRef.current = channel;

    channel.listen(".message.sent", (payload: MessageSentPayload) => {
      qc.setQueryData<MessagesCache | undefined>(messageKey(roomId), (old) => {
        if (!old) return old;
        // dedupe — the sender may already have it via optimistic update
        if (old.data.some((m) => m.id === payload.id)) return old;
        return { ...old, data: [...old.data, payload] };
      });
      // refresh room list so latest message / unread counts update
      qc.invalidateQueries({ queryKey: ["chat", "rooms"] });
    });

    channel.listen(
      ".user.typing",
      (payload: { user_id: number; user_name: string; typing: boolean }) => {
        qc.setQueryData(["chat", "typing", roomId], payload);
      },
    );

    return () => {
      echo.leave(`chat.room.${roomId}`);
      channelRef.current = null;
    };
  }, [roomId, qc]);

  // Send text message with optimistic insert
  const sendText = useMutation({
    mutationFn: (content: string) =>
      chatService.sendText(roomId as number, content),
    onMutate: async (content) => {
      if (!roomId) return;
      const key = messageKey(roomId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MessagesCache>(key);
      if (previous) {
        const optimistic: ChatMessage = {
          id: -Date.now(),
          room_id: roomId,
          sender_id: 0,
          sender_name: "You",
          type: "text",
          content,
          voice_path: null,
          voice_duration_ms: null,
          voice_size_bytes: null,
          created_at: new Date().toISOString(),
        };
        qc.setQueryData<MessagesCache>(key, {
          ...previous,
          data: [...previous.data, optimistic],
        });
      }
      return { previous };
    },
    onError: (_err, _content, ctx) => {
      if (roomId && ctx?.previous) {
        qc.setQueryData(messageKey(roomId), ctx.previous);
      }
    },
    onSuccess: (message) => {
      if (!roomId) return;
      qc.setQueryData<MessagesCache | undefined>(messageKey(roomId), (old) => {
        if (!old) return old;
        const withoutOptimistic = old.data.filter((m) => m.id > 0);
        if (withoutOptimistic.some((m) => m.id === message.id)) {
          return { ...old, data: withoutOptimistic };
        }
        return { ...old, data: [...withoutOptimistic, message] };
      });
    },
  });

  // Voice message mutation
  const sendVoice = useMutation({
    mutationFn: async (payload: {
      blob: Blob;
      durationMs: number;
      mime: string;
    }) => {
      if (!roomId) throw new Error("No room selected");
      const presign = await chatService.presignVoiceUpload(
        roomId,
        payload.mime,
        payload.blob.size,
      );
      const upload = await fetch(presign.upload_url, {
        method: "PUT",
        headers: presign.headers,
        body: payload.blob,
      });
      if (!upload.ok) {
        throw new Error(`Voice upload failed: ${upload.status}`);
      }
      return chatService.attachVoice(roomId, {
        voice_path: presign.key,
        voice_duration_ms: payload.durationMs,
        voice_size_bytes: payload.blob.size,
      });
    },
    onSuccess: (message) => {
      if (!roomId) return;
      qc.setQueryData<MessagesCache | undefined>(messageKey(roomId), (old) =>
        old ? { ...old, data: [...old.data, message] } : undefined,
      );
      qc.invalidateQueries({ queryKey: ["chat", "rooms"] });
    },
  });

  return {
    messages: messagesQuery.data?.data ?? [],
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    sendText,
    sendVoice,
  };
}
