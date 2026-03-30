import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export interface ChatMessage {
  id: bigint;
  nickname: string;
  text: string;
  timestamp: bigint;
}

export function useGetAllMessages() {
  const { actor, isFetching } = useActor();
  return useQuery<ChatMessage[]>({
    queryKey: ["allMessages"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllMessages();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useGetMessages(sinceId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<ChatMessage[]>({
    queryKey: ["messages", sinceId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getMessages(sinceId);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function usePostMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<bigint, Error, { nickname: string; text: string }>({
    mutationFn: async ({ nickname, text }) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).postMessage(nickname, text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allMessages"] });
    },
  });
}
