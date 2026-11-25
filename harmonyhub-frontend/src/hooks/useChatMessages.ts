import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/api/services/chatService";
import { echo } from "@/lib/echo";
import type { ChatMessage, Paginated } from "@/types";

const messageKey = (roomId: number) => ["chat", "messages", roomId];

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

    channel.listen(".message.sent", (payload: ChatMessage) => {
      qc.setQueryData<MessagesCache | undefined>(messageKey(roomId), (old) => {
        if (!old) return old;
        if (old.data.some((m) => m.id === payload.id)) return old;
        return { ...old, data: [...old.data, payload] };
      });
      qc.invalidateQueries({ queryKey: ["chat", "rooms"] });
    });

    channel.listen(".message.updated", (payload: ChatMessage) => {
      qc.setQueryData<MessagesCache | undefined>(messageKey(roomId), (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((m) => (m.id === payload.id ? payload : m)),
        };
      });
      qc.invalidateQueries({ queryKey: ["chat", "pinned", roomId] });
    });

    channel.listen(
      ".message.deleted",
      (payload: { id: number; room_id: number }) => {
        qc.setQueryData<MessagesCache | undefined>(
          messageKey(roomId),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((m) =>
                m.id === payload.id
                  ? {
                      ...m,
                      content: null,
                      voice_path: null,
                      deleted_at: new Date().toISOString(),
                    }
                  : m,
              ),
            };
          },
        );
      },
    );

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
    mutationFn: (payload: {
      content?: string;
      reply_to_id?: number;
      forwarded_from_id?: number;
      song_id?: number;
    }) => chatService.sendText(roomId as number, payload),
    onMutate: async (payload) => {
      if (!roomId) return;
      const key = messageKey(roomId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MessagesCache>(key);
      if (previous && payload.content) {
        const optimistic: ChatMessage = {
          id: -Date.now(),
          room_id: roomId,
          sender_id: 0,
          sender_name: "You",
          type: "text",
          content: payload.content,
          voice_path: null,
          voice_duration_ms: null,
          voice_size_bytes: null,
          edited_at: null,
          pinned_at: null,
          pinned_by: null,
          deleted_at: null,
          created_at: new Date().toISOString(),
          reply_to: null,
          forwarded_from: null,
          song: null,
        };
        qc.setQueryData<MessagesCache>(key, {
          ...previous,
          data: [...previous.data, optimistic],
        });
      }
      return { previous };
    },
    onError: (_err, _payload, ctx) => {
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

  const editText = useMutation({
    mutationFn: (vars: { messageId: number; content: string }) =>
      chatService.editMessage(roomId as number, vars.messageId, vars.content),
    onSuccess: (updated) => {
      if (!roomId) return;
      qc.setQueryData<MessagesCache | undefined>(messageKey(roomId), (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((m) => (m.id === updated.id ? updated : m)),
        };
      });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: (messageId: number) =>
      chatService.deleteMessage(roomId as number, messageId),
    onSuccess: (_data, messageId) => {
      if (!roomId) return;
      qc.setQueryData<MessagesCache | undefined>(messageKey(roomId), (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: null,
                  voice_path: null,
                  deleted_at: new Date().toISOString(),
                }
              : m,
          ),
        };
      });
    },
  });

  const pinMessage = useMutation({
    mutationFn: (vars: { messageId: number; pinned: boolean }) =>
      chatService.pinMessage(roomId as number, vars.messageId, vars.pinned),
    onSuccess: (updated) => {
      if (!roomId) return;
      qc.setQueryData<MessagesCache | undefined>(messageKey(roomId), (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((m) => (m.id === updated.id ? updated : m)),
        };
      });
      qc.invalidateQueries({ queryKey: ["chat", "pinned", roomId] });
    },
  });

  const pinnedQuery = useQuery<ChatMessage[]>({
    queryKey: ["chat", "pinned", roomId ?? 0],
    queryFn: () => chatService.listPinned(roomId as number),
    enabled: !!roomId,
    staleTime: 30_000,
  });

  return {
    messages: messagesQuery.data?.data ?? [],
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    sendText,
    sendVoice,
    editText,
    deleteMessage,
    pinMessage,
    pinned: pinnedQuery.data ?? [],
    pinnedLoading: pinnedQuery.isLoading,
  };
}
