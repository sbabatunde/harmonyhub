import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase"; // Your existing Supabase client

// Define message type
interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
}

export function useChat(roomId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["chat", roomId];

  // 1. Fetch historical messages with useQuery
  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      // Assume you have a messages table to store history
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!roomId,
  });

  // 2. Subscribe to Broadcast
  useEffect(() => {
    if (!roomId) return;

    // Key: use private channel for production [citation:2][citation:12]
    const channel = supabase.channel(`room:${roomId}`, {
      config: { private: true },
    });

    channel
      .on("broadcast", { event: "new_message" }, (payload) => {
        const newMessage = payload.payload as ChatMessage;
        // 3. Append new message to TanStack Query cache
        queryClient.setQueryData(queryKey, (old: ChatMessage[] = []) => [
          ...old,
          newMessage,
        ]);
      })
      .subscribe();

    // 4. Cleanup function: leave channel
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  // 5. Send message method
  const sendMessage = async (
    content: string,
    user: { id: string; name: string },
  ) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      sender_id: user.id,
      sender_name: user.name,
      created_at: new Date().toISOString(),
    };

    // Persist to database (for loading history)
    await supabase.from("messages").insert({
      room_id: roomId,
      content,
      sender_id: user.id,
      sender_name: user.name,
    });

    // Broadcast to other clients in the room (note: use httpSend, no need to subscribe first)
    const channel = supabase.channel(`room:${roomId}`);
    await channel.httpSend("new_message", newMessage);
    // You can also use channel.send() after subscribe, but httpSend is more direct [citation:9]
  };

  return { messages, isLoading, sendMessage };
}
