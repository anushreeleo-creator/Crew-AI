import { useCallback, useEffect, useRef, useState } from "react";
import type { Message, Poll } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import type { AISuggestion } from "@/components/SuggestionStrip";

const WS_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `wss://${process.env.EXPO_PUBLIC_DOMAIN}/api/ws`
  : null;

export const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

export interface TypingUser {
  userId: string;
  userName: string;
}

export interface ConsensusDetection {
  detectionId: string;
  groupId: string;
  topic: string;
  recommendedOutcome: string;
  confidenceScore: number;
  supportCount: number;
  opposeCount: number;
  yesVotes: number;
  noVotes: number;
  totalMembers: number;
  myVote?: "confirm" | "reject" | null;
}

export interface ConsensusVoteUpdate {
  detectionId: string;
  yesVotes: number;
  noVotes: number;
  totalMembers: number;
  autoResolved: boolean;
  outcome?: "confirmed" | "dismissed";
}

export interface ConsensusPollResolved {
  detectionId: string;
  approved: boolean;
  yesVotes: number;
  noVotes: number;
}

interface UseChatOptions {
  onAiThinking?: (isThinking: boolean) => void;
  onSuggestions?: (suggestions: AISuggestion[]) => void;
  onLimitReached?: (used: number, limit: number, isPremium: boolean) => void;
  onDecisionResolved?: (cardId: string) => void;
  onDecisionCardCreated?: () => void;
  onConsensusDetected?: (data: ConsensusDetection) => void;
  onConsensusVoteUpdate?: (data: ConsensusVoteUpdate) => void;
  onConsensusPollResolved?: (data: ConsensusPollResolved) => void;
  groupName?: string;
}

interface UseChatReturn {
  connected: boolean;
  typingUsers: TypingUser[];
  readReceipts: Record<string, string>;
  aiThinking: boolean;
  sendWSMessage: (msg: {
    id: string;
    text: string;
    imageUrl?: string;
    msgType?: string;
    timestamp: string;
  }) => void;
  notifyTyping: (isTyping: boolean) => void;
  notifyRead: (lastMsgId: string) => void;
  uploadImage: (uri: string, mimeType?: string) => Promise<string | null>;
}

export function useChat(
  groupId: string,
  onMessage: (msg: Message) => void,
  options?: UseChatOptions,
): UseChatReturn {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [readReceipts, setReadReceipts] = useState<Record<string, string>>({});
  const [aiThinking, setAiThinking] = useState(false);
  const groupIdRef = useRef(groupId);
  const onMessageRef = useRef(onMessage);
  const mountedRef = useRef(true);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef(user);
  const optionsRef = useRef(options);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { groupIdRef.current = groupId; }, [groupId]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { optionsRef.current = options; }, [options]);

  const connect = useCallback(() => {
    if (!WS_URL || !userRef.current || !groupIdRef.current) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      ws.send(
        JSON.stringify({
          type: "join",
          groupId: groupIdRef.current,
          userId: userRef.current!.id,
          userName: userRef.current!.name,
          groupName: optionsRef.current?.groupName,
        }),
      );
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(event.data as string) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = data.type as string;

      if (type === "ai_thinking") {
        const isThinking = data.isThinking as boolean;
        setAiThinking(isThinking);
        optionsRef.current?.onAiThinking?.(isThinking);
        return;
      }

      if (type === "history") {
        const raw = data.messages as Array<Record<string, unknown>>;
        raw.forEach((m) => {
          if (m.senderId === userRef.current?.id) return;
          const mapped: Message = {
            id: m.id as string,
            groupId: m.groupId as string,
            senderId: m.senderId as string,
            senderName: m.senderName as string,
            text: (m.text as string) ?? "",
            type: (m.msgType as Message["type"]) ?? (m.type as Message["type"]) ?? "text",
            imageUrl: m.imageUrl as string | undefined,
            timestamp: m.timestamp as string,
            poll: m.poll as Poll | undefined,
            decisionCard: m.decisionCard as Message["decisionCard"],
          };
          onMessageRef.current(mapped);
        });
        return;
      }

      if (type === "message") {
        const m = data as Record<string, unknown>;
        if (m.senderId === userRef.current?.id) return;
        const mapped: Message = {
          id: m.id as string,
          groupId: m.groupId as string,
          senderId: m.senderId as string,
          senderName: m.senderName as string,
          text: (m.text as string) ?? "",
          type: (m.msgType as Message["type"]) ?? "text",
          imageUrl: m.imageUrl as string | undefined,
          timestamp: m.timestamp as string,
          poll: m.poll as Poll | undefined,
          decisionCard: m.decisionCard as Message["decisionCard"],
        };
        onMessageRef.current(mapped);
        return;
      }

      if (type === "typing") {
        const { userId, userName, isTyping } = data as {
          userId: string;
          userName: string;
          isTyping: boolean;
        };
        if (userId === userRef.current?.id) return;
        setTypingUsers((prev) => {
          if (isTyping) {
            if (prev.some((u) => u.userId === userId)) return prev;
            return [...prev, { userId, userName }];
          }
          return prev.filter((u) => u.userId !== userId);
        });
        return;
      }

      if (type === "read") {
        const { userId, lastMsgId } = data as { userId: string; lastMsgId: string };
        setReadReceipts((prev) => ({ ...prev, [userId]: lastMsgId }));
        return;
      }

      if (type === "suggestions") {
        const suggestions = data.suggestions as AISuggestion[];
        optionsRef.current?.onSuggestions?.(suggestions);
        return;
      }

      if (type === "ai_limit_reached") {
        const { used, limit, isPremium } = data as { used: number; limit: number; isPremium: boolean };
        optionsRef.current?.onLimitReached?.(used, limit, isPremium);
        return;
      }

      if (type === "decision_resolved") {
        optionsRef.current?.onDecisionResolved?.(data.cardId as string);
        return;
      }

      if (type === "decision_card_created") {
        optionsRef.current?.onDecisionCardCreated?.();
        return;
      }

      if (type === "consensus_detected" && data.detectionId) {
        optionsRef.current?.onConsensusDetected?.({
          detectionId: data.detectionId as string,
          groupId: groupIdRef.current ?? "",
          topic: data.topic as string,
          recommendedOutcome: data.recommendedOutcome as string,
          confidenceScore: data.confidenceScore as number,
          supportCount: data.supportCount as number,
          opposeCount: data.opposeCount as number,
          yesVotes: 0,
          noVotes: 0,
          totalMembers: (data.totalMembers as number) ?? 0,
          myVote: null,
        });
        return;
      }

      if (type === "consensus_vote_update" && data.detectionId) {
        optionsRef.current?.onConsensusVoteUpdate?.({
          detectionId: data.detectionId as string,
          yesVotes: data.yesVotes as number,
          noVotes: data.noVotes as number,
          totalMembers: data.totalMembers as number,
          autoResolved: data.autoResolved as boolean,
          outcome: data.outcome as "confirmed" | "dismissed" | undefined,
        });
        return;
      }

      if (type === "consensus_poll_resolved" && data.detectionId) {
        optionsRef.current?.onConsensusPollResolved?.({
          detectionId: data.detectionId as string,
          approved: data.approved as boolean,
          yesVotes: data.yesVotes as number,
          noVotes: data.noVotes as number,
        });
        return;
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      setAiThinking(false);
      wsRef.current = null;
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendWSMessage = useCallback(
    (msg: {
      id: string;
      text: string;
      imageUrl?: string;
      msgType?: string;
      timestamp: string;
    }) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "message",
            groupId: groupIdRef.current,
            ...msg,
          }),
        );
      }
    },
    [],
  );

  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notifyTyping = useCallback((isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (isTyping) {
      if (typingDebounceRef.current) return;
      wsRef.current.send(
        JSON.stringify({
          type: "typing_start",
          groupId: groupIdRef.current,
        }),
      );
      typingDebounceRef.current = setTimeout(() => {
        typingDebounceRef.current = null;
      }, 2000);
    } else {
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
        typingDebounceRef.current = null;
      }
      wsRef.current.send(
        JSON.stringify({
          type: "typing_stop",
          groupId: groupIdRef.current,
        }),
      );
    }
  }, []);

  const notifyRead = useCallback((lastMsgId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "read",
          groupId: groupIdRef.current,
          lastMsgId,
        }),
      );
    }
  }, []);

  const uploadImage = useCallback(async (uri: string, mimeType = "image/jpeg"): Promise<string | null> => {
    try {
      const FileSystem = await import("expo-file-system");
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const res = await fetch(`${API_BASE}/chat/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mimeType }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { url: string };
      return `https://${process.env.EXPO_PUBLIC_DOMAIN}${data.url}`;
    } catch {
      return null;
    }
  }, []);

  return {
    connected,
    typingUsers,
    readReceipts,
    aiThinking,
    sendWSMessage,
    notifyTyping,
    notifyRead,
    uploadImage,
  };
}
