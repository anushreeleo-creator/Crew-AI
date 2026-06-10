import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth as useClerkAuth } from "@clerk/expo";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Poll {
  question: string;
  options: PollOption[];
}

export interface DecisionCardEmbed {
  id:           string;
  title:        string;
  description:  string;
  decisionType: string;
  status:       string;
  priority:     string;
  options:      string[];
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  text: string;
  type: "text" | "ai" | "poll" | "recap" | "system" | "image" | "decision_card" | "decision_resolution";
  timestamp: string;
  imageUri?: string;
  imageUrl?: string;
  poll?: Poll;
  decisionCard?: DecisionCardEmbed;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  color: string;
  inviteCode: string;
  memberCount: number;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

interface AppContextValue {
  groups: Group[];
  isLoading: boolean;
  createGroup: (name: string, emoji: string) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<Group | null>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  getMessages: (groupId: string) => Message[];
  sendMessage: (groupId: string, text: string, imageUri?: string) => Promise<Message>;
  receiveMessage: (groupId: string, msg: Message) => void;
  votePoll: (groupId: string, messageId: string, optionId: string) => void;
  clearUnread: (groupId: string) => void;
  refetchGroups: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);
const MESSAGES_PREFIX = "crewai_msgs_v1_";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { getToken } = useClerkAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const messagesRef = useRef<Record<string, Message[]>>({});

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const authFetch = useCallback(
    async (path: string, opts: RequestInit = {}): Promise<Response> => {
      const token = await getToken();
      return global.fetch(`${API_BASE}${path}`, {
        ...opts,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(opts.headers as Record<string, string> | undefined),
        },
      });
    },
    [getToken],
  );

  const loadMessagesFromStorage = useCallback(async (groupIds: string[]) => {
    const msgMap: Record<string, Message[]> = {};
    for (const gid of groupIds) {
      const raw = await AsyncStorage.getItem(MESSAGES_PREFIX + gid);
      msgMap[gid] = raw ? (JSON.parse(raw) as Message[]) : [];
    }
    return msgMap;
  }, []);

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await authFetch("/groups");
      if (res.ok) {
        const data = (await res.json()) as {
          groups: {
            id: string;
            name: string;
            emoji: string | null;
            color: string;
            inviteCode: string;
            memberCount: number;
            createdAt: string;
          }[];
        };
        const loaded: Group[] = data.groups.map((g) => ({
          id: g.id,
          name: g.name,
          emoji: g.emoji ?? "🎉",
          color: g.color,
          inviteCode: g.inviteCode,
          memberCount: g.memberCount,
          createdAt: g.createdAt,
          unreadCount: 0,
        }));
        setGroups(loaded);
        const msgMap = await loadMessagesFromStorage(loaded.map((g) => g.id));
        setMessages(msgMap);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [user, authFetch, loadMessagesFromStorage]);

  useEffect(() => {
    void fetchGroups();
  }, [fetchGroups]);

  const persistMessages = async (groupId: string, msgs: Message[]) => {
    await AsyncStorage.setItem(MESSAGES_PREFIX + groupId, JSON.stringify(msgs));
  };

  const createGroup = useCallback(
    async (name: string, emoji: string): Promise<Group> => {
      if (!user) throw new Error("Not logged in");
      const res = await authFetch("/groups", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), emoji }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error ?? "Failed to create group");
      }
      const data = (await res.json()) as {
        group: {
          id: string;
          name: string;
          emoji: string | null;
          color: string;
          inviteCode: string;
          memberCount: number;
          createdAt: string;
        };
      };
      const group: Group = {
        id: data.group.id,
        name: data.group.name,
        emoji: data.group.emoji ?? emoji,
        color: data.group.color,
        inviteCode: data.group.inviteCode,
        memberCount: data.group.memberCount,
        createdAt: data.group.createdAt,
        unreadCount: 0,
      };
      setGroups((prev) => [group, ...prev]);
      return group;
    },
    [user, authFetch],
  );

  const joinGroup = useCallback(
    async (inviteCode: string): Promise<Group | null> => {
      if (!user) return null;
      const res = await authFetch("/groups/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        group: {
          id: string;
          name: string;
          emoji: string | null;
          color: string;
          inviteCode: string;
          createdAt: string;
        };
      };
      const group: Group = {
        id: data.group.id,
        name: data.group.name,
        emoji: data.group.emoji ?? "🎉",
        color: data.group.color,
        inviteCode: data.group.inviteCode,
        memberCount: 1,
        createdAt: data.group.createdAt,
        unreadCount: 0,
      };
      setGroups((prev) => {
        if (prev.some((g) => g.id === group.id)) return prev;
        return [group, ...prev];
      });
      return group;
    },
    [user, authFetch],
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!user) return;
      try {
        await authFetch(`/groups/${groupId}/leave`, { method: "DELETE" });
      } catch {
      }
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      const { [groupId]: _, ...rest } = messagesRef.current;
      setMessages(rest);
      await AsyncStorage.removeItem(MESSAGES_PREFIX + groupId);
    },
    [user, authFetch],
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (!user) return;
      try {
        await authFetch(`/groups/${groupId}`, { method: "DELETE" });
      } catch {
      }
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      const { [groupId]: _, ...rest } = messagesRef.current;
      setMessages(rest);
      await AsyncStorage.removeItem(MESSAGES_PREFIX + groupId);
    },
    [user, authFetch],
  );

  const getMessages = useCallback(
    (groupId: string): Message[] => {
      return messages[groupId] ?? [];
    },
    [messages],
  );

  const sendMessage = useCallback(
    async (groupId: string, text: string, imageUri?: string): Promise<Message> => {
      if (!user) throw new Error("Not logged in");

      const msg: Message = {
        id: genId(),
        groupId,
        senderId: user.id,
        senderName: user.name,
        text,
        type: imageUri && !text ? "image" : "text",
        timestamp: new Date().toISOString(),
        imageUri,
      };

      const current = messagesRef.current[groupId] ?? [];
      const updated = [...current, msg];
      const newMsgMap = { ...messagesRef.current, [groupId]: updated };
      setMessages(newMsgMap);

      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, lastMessage: text || "📷 Image", lastMessageAt: msg.timestamp }
            : g,
        ),
      );
      await persistMessages(groupId, updated);

      return msg;
    },
    [user],
  );

  const receiveMessage = useCallback(
    (groupId: string, msg: Message) => {
      const current = messagesRef.current[groupId] ?? [];
      if (current.some((m) => m.id === msg.id)) return;
      const updated = [...current, msg].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      const newMap = { ...messagesRef.current, [groupId]: updated };
      setMessages(newMap);
      persistMessages(groupId, updated);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                lastMessage: msg.text || "📷 Image",
                lastMessageAt: msg.timestamp,
                unreadCount: g.unreadCount + 1,
              }
            : g,
        ),
      );
    },
    [],
  );

  const votePoll = useCallback(
    (groupId: string, messageId: string, optionId: string) => {
      if (!user) return;
      const current = messagesRef.current[groupId] ?? [];
      const updated = current.map((m) => {
        if (m.id !== messageId || !m.poll) return m;
        const alreadyVoted = m.poll.options.some((o) =>
          o.votes.includes(user.id),
        );
        const newOptions = m.poll.options.map((o) => {
          let votes = o.votes.filter((v) => v !== user.id);
          if (o.id === optionId && !alreadyVoted) votes = [...votes, user.id];
          return { ...o, votes };
        });
        return { ...m, poll: { ...m.poll, options: newOptions } };
      });
      const newMap = { ...messagesRef.current, [groupId]: updated };
      setMessages(newMap);
      persistMessages(groupId, updated);
    },
    [user],
  );

  const clearUnread = useCallback(
    (groupId: string) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, unreadCount: 0 } : g)),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      groups,
      isLoading,
      createGroup,
      joinGroup,
      leaveGroup,
      deleteGroup,
      getMessages,
      sendMessage,
      receiveMessage,
      votePoll,
      clearUnread,
      refetchGroups: fetchGroups,
    }),
    [
      groups,
      isLoading,
      createGroup,
      joinGroup,
      leaveGroup,
      deleteGroup,
      getMessages,
      sendMessage,
      receiveMessage,
      votePoll,
      clearUnread,
      fetchGroups,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
