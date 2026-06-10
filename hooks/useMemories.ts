import { useState, useCallback } from "react";
import { useAuthFetch } from "./useAuthFetch";

export type MemoryCategory =
  | "decision"
  | "food"
  | "budget"
  | "travel"
  | "event"
  | "fact";

export interface GroupMemory {
  id: string;
  groupId: string;
  category: MemoryCategory;
  content: string;
  confidence: number;
  extractedAt: string;
}

export function useMemories(groupId: string) {
  const authFetch = useAuthFetch();
  const [memories, setMemories] = useState<GroupMemory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      const res = await authFetch(`/groups/${groupId}/memories`);
      if (res.ok) {
        const data = (await res.json()) as { memories: GroupMemory[] };
        setMemories(data.memories ?? []);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [groupId, authFetch]);

  const deleteMemory = useCallback(
    async (memoryId: string) => {
      try {
        await authFetch(`/groups/${groupId}/memories/${memoryId}`, {
          method: "DELETE",
        });
        setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      } catch {}
    },
    [groupId, authFetch],
  );

  return { memories, isLoading, fetch, deleteMemory };
}
