import { Icon } from "@/components/Icon";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageBubble } from "@/components/MessageBubble";
import { PollCard } from "@/components/PollCard";
import { DecisionCardChatBubble } from "@/components/DecisionCardChatBubble";
import { DecisionsDashboard } from "@/components/DecisionsDashboard";
import { RecapCard } from "@/components/RecapCard";
import type { Message } from "@/contexts/AppContext";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useChat, API_BASE } from "@/hooks/useChat";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { SuggestionStrip, type AISuggestion } from "@/components/SuggestionStrip";
import { DecisionSuggestionBanner, type DecisionSuggestion } from "@/components/DecisionSuggestionBanner";
import { ConsensusCard } from "@/components/ConsensusCard";
import { DecisionTimeline } from "@/components/DecisionTimeline";
import type { ConsensusDetection, ConsensusVoteUpdate } from "@/hooks/useChat";

const DECISION_PATTERNS: Array<{ regex: RegExp; type: string; priority: string; label: string }> = [
  { regex: /where should we eat\b/i,                                             type: "restaurant", priority: "medium", label: "Restaurant decision" },
  { regex: /where (?:do|should) we go\b/i,                                       type: "restaurant", priority: "medium", label: "Where should we go?" },
  { regex: /let['']?s go to\b/i,                                                 type: "custom",     priority: "medium", label: "Group outing" },
  { regex: /should we (?:choose|pick|go with|use|try|book|get)\b/i,              type: "custom",     priority: "medium", label: "Group choice" },
  { regex: /what time (?:works|should we|are we)\b/i,                            type: "meeting",    priority: "medium", label: "Meeting time" },
  { regex: /who['']?s bringing\b/i,                                              type: "task",       priority: "medium", label: "Task assignment" },
  { regex: /can someone\b/i,                                                     type: "task",       priority: "low",    label: "Task needed" },
  { regex: /let['']?s plan\b/i,                                                  type: "event",      priority: "medium", label: "Group plan" },
  { regex: /which (?:one|place|option|restaurant|hotel|venue|date|day|time)\b/i, type: "custom",     priority: "medium", label: "Group choice" },
  { regex: /when (?:should|do|are) we\b/i,                                       type: "meeting",    priority: "medium", label: "Timing decision" },
  { regex: /who['']?s (?:in\b|coming\b|joining\b|going\b|up for)\b/i,           type: "event",      priority: "low",    label: "Attendance check" },
  { regex: /who should\b/i,                                                      type: "task",       priority: "low",    label: "Task assignment" },
  { regex: /should we\b/i,                                                       type: "custom",     priority: "low",    label: "Group decision" },
];

function TypingDots({ color }: { color: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ]),
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 200);
    const a3 = anim(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  const dot = (anim: Animated.Value) => (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color, opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
      ]}
    />
  );

  return (
    <View style={styles.dotsRow}>
      {dot(dot1)}{dot(dot2)}{dot(dot3)}
    </View>
  );
}

export default function GroupChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id, prefill } = useLocalSearchParams<{ id: string; prefill?: string }>();
  const { user } = useAuth();
  const authFetch = useAuthFetch();
  const { groups, getMessages, sendMessage, receiveMessage, votePoll, clearUnread, deleteGroup, leaveGroup } = useApp();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Decision detection state
  const [decisionSuggestion, setDecisionSuggestion] = useState<DecisionSuggestion | null>(null);
  const seenDecisionIdsRef      = useRef<Set<string>>(new Set());
  const dismissedDecisionIdsRef = useRef<Set<string>>(new Set());

  const group = groups.find((g) => g.id === id);
  const localMessages = getMessages(id ?? "");

  const pinnedCard = useMemo(
    () =>
      [...localMessages]
        .reverse()
        .find((m) => m.type === "decision_card" && m.decisionCard?.status === "voting")
        ?.decisionCard ?? null,
    [localMessages],
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleWSMessage = useCallback(
    (msg: Message) => {
      if (!id) return;
      receiveMessage(id, msg);
    },
    [id, receiveMessage],
  );

  const dismissedIdsRef = useRef<Set<string>>(new Set());

  const handleSuggestions = useCallback((incoming: AISuggestion[]) => {
    setSuggestions(incoming.filter((s) => !dismissedIdsRef.current.has(s.id)));
  }, []);

  const handleSuggestionAction = useCallback((action: string) => {
    setText(action);
    setSuggestions([]);
    dismissedIdsRef.current.clear();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSuggestionDismiss = useCallback((id: string) => {
    dismissedIdsRef.current.add(id);
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const [aiLimitBanner, setAiLimitBanner] = useState<{
    used: number;
    limit: number;
    isPremium: boolean;
  } | null>(null);
  const [activeGroupTab, setActiveGroupTab] = useState<"chat" | "decisions" | "timeline" | "summaries">("chat");
  const [decisionsRefreshKey, setDecisionsRefreshKey] = useState(0);
  const [consensusData, setConsensusData] = useState<ConsensusDetection | null>(null);
  const dismissedConsensusRef = useRef<Set<string>>(new Set());

  const handleLimitReached = useCallback((used: number, limit: number, isPremium: boolean) => {
    setAiLimitBanner({ used, limit, isPremium });
  }, []);

  const handleDecisionResolved = useCallback(() => {
    setDecisionsRefreshKey((k) => k + 1);
  }, []);

  const handleDecisionCardCreated = useCallback(() => {
    setDecisionsRefreshKey((k) => k + 1);
  }, []);

  const handleConsensusDetected = useCallback((data: ConsensusDetection) => {
    if (dismissedConsensusRef.current.has(data.detectionId)) return;
    setConsensusData(data);
  }, []);

  const handleConsensusVoteUpdate = useCallback((update: ConsensusVoteUpdate) => {
    setConsensusData((prev) => {
      if (!prev || prev.detectionId !== update.detectionId) return prev;
      if (update.autoResolved) return null;
      return { ...prev, yesVotes: update.yesVotes, noVotes: update.noVotes, totalMembers: update.totalMembers };
    });
    if (update.autoResolved && update.outcome === "confirmed") {
      setDecisionsRefreshKey((k) => k + 1);
    }
  }, []);

  const handleConsensusPollResolved = useCallback((data: { detectionId: string; approved: boolean }) => {
    dismissedConsensusRef.current.add(data.detectionId);
    setConsensusData((prev) => (prev?.detectionId === data.detectionId ? null : prev));
    if (data.approved) {
      setDecisionsRefreshKey((k) => k + 1);
    }
  }, []);

  const { connected, typingUsers, readReceipts, aiThinking, sendWSMessage, notifyTyping, notifyRead, uploadImage } =
    useChat(id ?? "", handleWSMessage, {
      groupName: group?.name,
      onSuggestions: handleSuggestions,
      onLimitReached: handleLimitReached,
      onDecisionResolved: handleDecisionResolved,
      onDecisionCardCreated: handleDecisionCardCreated,
      onConsensusDetected: handleConsensusDetected,
      onConsensusVoteUpdate: handleConsensusVoteUpdate,
      onConsensusPollResolved: handleConsensusPollResolved,
    });

  useEffect(() => {
    if (id) clearUnread(id);
  }, [id]);

  useEffect(() => {
    if (!id || !user?.id) return;
    void authFetch(`/groups/${id}/members`).then(async (res) => {
      if (!res.ok) return;
      const data = (await res.json()) as { members: Array<{ userId: string; role: string }> };
      const me = data.members.find((m) => m.userId === user.id);
      setIsOwner(me?.role === "owner");
    }).catch(() => {});
  }, [id, user?.id, authFetch]);

  useEffect(() => {
    if (prefill) {
      setText(prefill);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [prefill]);

  // Detect decision-opportunity phrases in new messages
  useEffect(() => {
    for (const msg of localMessages) {
      if (seenDecisionIdsRef.current.has(msg.id)) continue;
      seenDecisionIdsRef.current.add(msg.id);
      if (msg.type !== "text") continue;
      if (msg.senderId === "ai" || msg.senderId === "system") continue;
      if (dismissedDecisionIdsRef.current.has(msg.id)) continue;
      for (const p of DECISION_PATTERNS) {
        const match = p.regex.exec(msg.text);
        if (match) {
          setDecisionSuggestion({
            messageId:        msg.id,
            messageText:      msg.text,
            matchedPhrase:    match[0],
            suggestedTitle:   p.label,
            suggestedType:    p.type,
            suggestedPriority: p.priority,
          });
          break;
        }
      }
    }
  }, [localMessages]);

  const lastOwnMsg = useMemo(() => {
    return [...localMessages].reverse().find((m) => m.senderId === user?.id);
  }, [localMessages, user?.id]);

  const isLastMsgRead = useMemo(() => {
    if (!lastOwnMsg) return false;
    return Object.values(readReceipts).some((msgId) => msgId === lastOwnMsg.id);
  }, [lastOwnMsg, readReceipts]);

  useEffect(() => {
    if (lastOwnMsg && id) {
      notifyRead(lastOwnMsg.id);
    }
  }, [lastOwnMsg?.id, notifyRead, id]);

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);
      if (value.trim()) {
        notifyTyping(true);
        if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = setTimeout(() => {
          notifyTyping(false);
          typingStopTimerRef.current = null;
        }, 2500);
      } else {
        if (typingStopTimerRef.current) {
          clearTimeout(typingStopTimerRef.current);
          typingStopTimerRef.current = null;
        }
        notifyTyping(false);
      }
    },
    [notifyTyping],
  );

  const handleConfirmDecision = async (overrides: {
    title: string; description: string; decisionType: string; priority: string;
  }) => {
    if (!id) return;
    try {
      const res = await authFetch(`/groups/${id}/decisions`, {
        method: "POST",
        body: JSON.stringify({
          title:        overrides.title,
          description:  overrides.description,
          decisionType: overrides.decisionType,
          status:       "pending",
          priority:     overrides.priority,
        }),
      });
      if (res.ok) {
        router.push({ pathname: "/group/decisions", params: { id } });
      }
    } finally {
      setDecisionSuggestion(null);
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !id) return;
    setText("");
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    notifyTyping(false);
    setSuggestions([]);
    dismissedIdsRef.current.clear();
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const msg = await sendMessage(id, trimmed);
      sendWSMessage({
        id: msg.id,
        text: trimmed,
        msgType: "text",
        timestamp: msg.timestamp,
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0] && id) {
      const uri = result.assets[0].uri;
      setUploadingImage(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        const remoteUrl = await uploadImage(uri);
        const msg = await sendMessage(id, "", uri);
        sendWSMessage({
          id: msg.id,
          text: "",
          imageUrl: remoteUrl ?? undefined,
          msgType: "image",
          timestamp: msg.timestamp,
        });
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isOwn = item.senderId === user?.id;
      const reversed = [...localMessages].reverse();
      const prevMsg = reversed[index + 1];
      const showName =
        !isOwn &&
        item.senderId !== "ai" &&
        item.type !== "system" &&
        prevMsg?.senderId !== item.senderId;

      const isLastOwn = item.id === lastOwnMsg?.id;

      if (item.type === "decision_card" && item.decisionCard) {
        return (
          <DecisionCardChatBubble
            card={item.decisionCard}
            timestamp={item.timestamp}
            groupId={id ?? ""}
            onDiscuss={() => inputRef.current?.focus()}
          />
        );
      }

      if (item.type === "poll" && item.poll) {
        return (
          <View>
            <MessageBubble message={{ ...item, type: "ai" } as Message} isOwn={false} />
            <PollCard
              messageId={item.id}
              groupId={id ?? ""}
              poll={item.poll}
              currentUserId={user?.id ?? ""}
              onVote={votePoll}
            />
          </View>
        );
      }

      if (item.type === "recap") {
        return <RecapCard text={item.text} timestamp={item.timestamp} />;
      }

      return (
        <MessageBubble
          message={item}
          isOwn={isOwn}
          showName={showName}
          isLastOwn={isLastOwn}
          isRead={isLastOwn && isLastMsgRead}
        />
      );
    },
    [user?.id, localMessages, lastOwnMsg?.id, isLastMsgRead, id, votePoll],
  );

  const typingLabel = useMemo(() => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0]!.userName} is typing`;
    if (typingUsers.length === 2)
      return `${typingUsers[0]!.userName} and ${typingUsers[1]!.userName} are typing`;
    return `${typingUsers[0]!.userName} and ${typingUsers.length - 1} others are typing`;
  }, [typingUsers]);

  const reversed = useMemo(() => [...localMessages].reverse(), [localMessages]);

  if (!group) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Group not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: topPad + 8,
          },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => router.push(`/group/members?id=${id}`)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.groupAvatarSm,
              { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" },
            ]}
          >
            {group.emoji ? (
              <Text style={styles.groupAvatarEmoji}>{group.emoji}</Text>
            ) : (
              <Text style={[styles.groupAvatarText, { color: group.color || colors.primary }]}>
                {group.name.slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <View>
            <Text style={[styles.groupName, { color: colors.foreground }]}>{group.name}</Text>
            <View style={styles.headerSub}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: connected ? colors.accent : colors.mutedForeground },
                ]}
              />
              <Text style={[styles.memberCount, { color: colors.mutedForeground }]}>
                {connected ? "live" : "connecting"} · {group.memberCount}{" "}
                member{group.memberCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => router.push(`/group/summaries?id=${id}`)}
        >
          <Icon name="document-text-outline" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => router.push(`/group/memory?id=${id}`)}
        >
          <Icon name="bulb-outline" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => router.push(`/group/invite?id=${id}`)}
        >
          <Icon name="person-add-outline" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => {
            const options = isOwner
              ? [
                  { text: "Delete Crew", style: "destructive" as const, onPress: () => {
                    Alert.alert(
                      "Delete Crew",
                      `Are you sure you want to delete "${group?.name}"? This cannot be undone.`,
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: async () => {
                          if (!id) return;
                          await deleteGroup(id);
                          router.replace("/");
                        }},
                      ]
                    );
                  }},
                  { text: "Cancel", style: "cancel" as const },
                ]
              : [
                  { text: "Leave Crew", style: "destructive" as const, onPress: () => {
                    Alert.alert(
                      "Leave Crew",
                      `Are you sure you want to leave "${group?.name}"?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Leave", style: "destructive", onPress: async () => {
                          if (!id) return;
                          await leaveGroup(id);
                          router.replace("/");
                        }},
                      ]
                    );
                  }},
                  { text: "Cancel", style: "cancel" as const },
                ];
            Alert.alert(
              group?.name ?? "Crew",
              undefined,
              options,
              { cancelable: true }
            );
          }}
        >
          <Icon name="ellipsis-horizontal" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Pinned active decision card */}
      {pinnedCard && (
        <TouchableOpacity
          style={[
            styles.pinnedBanner,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
          onPress={() => router.push(`/group/decisions?id=${id}`)}
          activeOpacity={0.85}
        >
          <Text style={styles.pinnedPinIcon}>📌</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pinnedTitle, { color: colors.foreground }]} numberOfLines={1}>
              {pinnedCard.title}
            </Text>
            <Text style={[styles.pinnedSub, { color: colors.mutedForeground }]}>
              🗳️ Voting · {pinnedCard.options.length} options
            </Text>
          </View>
          <Text style={[styles.pinnedArrow, { color: colors.mutedForeground }]}>›</Text>
        </TouchableOpacity>
      )}

      {/* Group tab bar — Chat | Decisions | Timeline | Summaries */}
      <View style={[styles.groupTabBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {([
          { key: "chat",      icon: "💬", label: "Chat"      },
          { key: "decisions", icon: "🗳️", label: "Decisions" },
          { key: "timeline",  icon: "📋", label: "Timeline"  },
          { key: "summaries", icon: "✨", label: "Summaries" },
        ] as const).map(({ key, icon, label }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.groupTab,
              activeGroupTab === key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => { setActiveGroupTab(key); void Haptics.selectionAsync(); }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14 }}>{icon}</Text>
            <Text style={[styles.groupTabLabel, { color: activeGroupTab === key ? colors.primary : colors.mutedForeground }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeGroupTab === "chat" && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={flatListRef}
          data={reversed}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          inverted
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 4 }}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <>
              {aiThinking && (
                <View
                  style={[
                    styles.aiThinking,
                    { backgroundColor: colors.card, borderColor: colors.accent + "33" },
                  ]}
                >
                  <View style={[styles.aiThinkingIcon, { backgroundColor: colors.accent + "20" }]}>
                    <Icon name="sparkles" size={12} color={colors.accent} />
                  </View>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[styles.aiThinkingText, { color: colors.mutedForeground }]}>
                    AI is thinking...
                  </Text>
                </View>
              )}
            </>
          }
        />

        {typingLabel && (
          <View
            style={[
              styles.typingBar,
              { backgroundColor: colors.background, borderTopColor: colors.border },
            ]}
          >
            <TypingDots color={colors.accent} />
            <Text style={[styles.typingText, { color: colors.mutedForeground }]}>
              {typingLabel}
            </Text>
          </View>
        )}

        {aiLimitBanner && (
          <View
            style={[
              styles.limitBanner,
              { backgroundColor: colors.card, borderColor: "#ff6b6b" },
            ]}
          >
            <Icon name="flash-off-outline" size={16} color="#ff6b6b" />
            <Text style={[styles.limitBannerText, { color: colors.foreground }]}>
              AI limit reached ({aiLimitBanner.used}/{aiLimitBanner.limit} today) — resets tomorrow
            </Text>
            <TouchableOpacity onPress={() => setAiLimitBanner(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        <SuggestionStrip
          suggestions={suggestions}
          onAction={handleSuggestionAction}
          onDismiss={handleSuggestionDismiss}
        />

        {/* Decision detection suggestion banner */}
        {decisionSuggestion && (
          <DecisionSuggestionBanner
            suggestion={decisionSuggestion}
            onConfirm={(overrides) => void handleConfirmDecision(overrides)}
            onDismiss={() => {
              dismissedDecisionIdsRef.current.add(decisionSuggestion.messageId);
              setDecisionSuggestion(null);
            }}
          />
        )}

        {/* Consensus card — shown above input when detected */}
        {consensusData && (
          <ConsensusCard
            consensus={consensusData}
            onDismiss={() => {
              dismissedConsensusRef.current.add(consensusData.detectionId);
              setConsensusData(null);
            }}
            onSaved={() => {
              dismissedConsensusRef.current.add(consensusData.detectionId);
              setConsensusData(null);
              setDecisionsRefreshKey((k) => k + 1);
              setActiveGroupTab("timeline");
            }}
            onVoteUpdate={({ yesVotes, noVotes, myVote }) => {
              setConsensusData((prev) => prev ? { ...prev, yesVotes, noVotes, myVote } : prev);
            }}
          />
        )}

        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: typingLabel ? "transparent" : colors.border,
              paddingBottom: botPad + 8,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.imgBtn}
            onPress={handlePickImage}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Icon name="image-outline" size={22} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>

          <View
            style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}
          >
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Message... (try @AI)"
              placeholderTextColor={colors.mutedForeground}
              value={text}
              onChangeText={handleTextChange}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: text.trim() ? colors.primary : colors.muted },
            ]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Icon
                name="send"
                size={18}
                color={text.trim() ? colors.primaryForeground : colors.mutedForeground}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      )}

      {/* Decisions tab */}
      {activeGroupTab === "decisions" && (
        <DecisionsDashboard groupId={id ?? ""} refreshKey={decisionsRefreshKey} />
      )}

      {/* Timeline tab */}
      {activeGroupTab === "timeline" && (
        <DecisionTimeline groupId={id ?? ""} insets={{ bottom: botPad }} />
      )}

      {/* Summaries tab */}
      {activeGroupTab === "summaries" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 40 }}>✨</Text>
          <Text style={{ fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.foreground, textAlign: "center" }}>
            Smart Summaries
          </Text>
          <Text style={{ fontSize: 13, textAlign: "center", color: colors.mutedForeground, lineHeight: 20 }}>
            AI-generated summaries of your crew's conversations. Tap below to see them.
          </Text>
          <TouchableOpacity
            style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary }}
            onPress={() => router.push(`/group/summaries?id=${id}`)}
          >
            <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>View Summaries</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  groupTabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 44,
  },
  groupTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  groupTabLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerSub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  groupAvatarSm: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  groupAvatarText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  groupAvatarEmoji: { fontSize: 20 },
  groupName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  memberCount: { fontSize: 11, fontFamily: "Inter_400Regular" },
  inviteBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 16, fontFamily: "Inter_400Regular" },
  aiThinking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  aiThinkingIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  aiThinkingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  limitBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  limitBannerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  typingBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  typingText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  imgBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  pinnedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pinnedPinIcon: {
    fontSize: 14,
  },
  pinnedTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  pinnedSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  pinnedArrow: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
  },
});
