import { useState, useCallback } from "react";
import { useAuthFetch } from "./useAuthFetch";

export type SummaryType = "daily" | "weekly" | "missed";
export type SummaryMode = "off" | "decisions_only" | "full" | "personalized";

export interface SummarySections {
  topics: string[];
  decisions: string[];
  actionItems: string[];
  openQuestions: string[];
  upcomingEvents: string[];
}

export interface GroupSummary {
  id: string;
  groupId: string;
  type: SummaryType;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  sections: SummarySections;
  messageCount: number;
}

export interface SummarySettings {
  mode: SummaryMode;
  daily: boolean;
  weekly: boolean;
  missed: boolean;
}

export function useSummaries(groupId: string) {
  const authFetch = useAuthFetch();
  const [summaries, setSummaries] = useState<GroupSummary[]>([]);
  const [settings, setSettingsState] = useState<SummarySettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchSummaries = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      const res = await authFetch(`/groups/${groupId}/summaries`);
      if (res.ok) {
        const data = (await res.json()) as { summaries: GroupSummary[] };
        setSummaries(data.summaries ?? []);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [groupId, authFetch]);

  const fetchSettings = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await authFetch(`/groups/${groupId}/summary-settings`);
      if (res.ok) {
        const data = (await res.json()) as { settings: SummarySettings };
        setSettingsState(data.settings);
      }
    } catch {}
  }, [groupId, authFetch]);

  const updateSettings = useCallback(
    async (patch: Partial<SummarySettings>) => {
      if (!groupId) return;
      try {
        const res = await authFetch(`/groups/${groupId}/summary-settings`, {
          method: "PUT",
          body: JSON.stringify(patch),
        });
        if (res.ok) {
          const data = (await res.json()) as { settings: SummarySettings };
          setSettingsState(data.settings);
        }
      } catch {}
    },
    [groupId, authFetch],
  );

  const generate = useCallback(
    async (type: SummaryType): Promise<GroupSummary | null> => {
      if (!groupId) return null;
      setIsGenerating(true);
      try {
        const res = await authFetch(`/groups/${groupId}/summaries/generate`, {
          method: "POST",
          body: JSON.stringify({ type }),
        });
        if (res.ok) {
          const data = (await res.json()) as { summary: GroupSummary };
          setSummaries((prev) => {
            const without = prev.filter((s) => s.type !== type);
            return [...without, data.summary].sort(
              (a, b) =>
                new Date(a.generatedAt).getTime() -
                new Date(b.generatedAt).getTime(),
            );
          });
          return data.summary;
        }
        return null;
      } catch {
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [groupId, authFetch],
  );

  return {
    summaries,
    settings,
    isLoading,
    isGenerating,
    fetchSummaries,
    fetchSettings,
    updateSettings,
    generate,
  };
}
