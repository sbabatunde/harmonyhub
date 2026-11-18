import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/api/services/chatService";
import type { ChatRoom } from "@/types";

export function useChatRooms() {
  return useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: () => chatService.listRooms(),
    staleTime: 30_000,
  });
}

export function useCreateChatRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name?: string;
      is_group: boolean;
      member_ids: number[];
    }) => chatService.createRoom(payload),
    onSuccess: (room: ChatRoom) => {
      qc.invalidateQueries({ queryKey: ["chat", "rooms"] });
      qc.setQueryData(["chat", "room", room.id], room);
    },
  });
}
