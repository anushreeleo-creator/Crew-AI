import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import type { DecisionCardEmbed } from "@/contexts/AppContext";

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  restaurant: { icon: "🍽️", label: "Restaurant",  color: "#f97316" },
  trip:       { icon: "✈️",  label: "Trip",         color: "#8b5cf6" },
  event:      { icon: "🎉", label: "Event",        color: "#ec4899" },
  budget:     { icon: "💰", label: "Budget",       color: "#10b981" },
  meeting:    { icon: "📅", label: "Meeting",      color: "#3b82f6" },
  task:       { icon: "✅", label: "Task",         color: "#6366f1" },
  custom:     { icon: "📌", label: "Decision",     color: "#7c6bff" },
};

const STATUS_META: Record<string, { icon: string; label: string; color: string }> = {
  voting:     { icon: "🗳️",  label: "Voting",      color: "#3b82f6" },
  approved:   { icon: "✅",  label: "Approved",    color: "#10b981" },
  rejected:   { icon: "❌",  label: "Rejected",    color: "#ef4444" },
  pending:    { icon: "⏳",  label: "Pending",     color: "#f59e0b" },
  in_progress:{ icon: "🔄", label: "In Progress", color: "#8b5cf6" },
  done:       { icon: "🏁", label: "Done",        color: "#64748b" },
  completed:  { icon: "🏁", label: "Done",        color: "#64748b" },
};

interface Props {
  card: DecisionCardEmbed;
  timestamp: string;
  groupId: string;
  onDiscuss?: () => void;
}

export function DecisionCardChatBubble({ card, timestamp, groupId, onDiscuss }: Props) {
  const colors    = useColors();
  const router    = useRouter();
  const authFetch = useAuthFetch();

  const [localStatus, setLocalStatus] = useState(card.status);
  const [resolving,   setResolving]   = useState(false);

  const typeMeta   = TYPE_META[card.decisionType] ?? TYPE_META.custom!;
  const statusMeta = STATUS_META[localStatus]     ?? STATUS_META.voting!;
  const isResolved = ["approved", "done", "completed", "rejected"].includes(localStatus);

  const ago = (() => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  })();

  async function handleResolve() {
    if (isResolved || resolving || !card.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setResolving(true);
    try {
      const res = await authFetch(`/groups/${groupId}/decisions/${card.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "approved" }),
      });
      if (res.ok) setLocalStatus("approved");
    } catch {
      // silently fail — keep previous state
    } finally {
      setResolving(false);
    }
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: typeMeta.color,
        },
      ]}
    >
      {/* ── Pinned strip ── */}
      <View style={[styles.pinStrip, { borderBottomColor: typeMeta.color + "30", backgroundColor: typeMeta.color + "0a" }]}>
        <Text style={[styles.pinIcon, { color: typeMeta.color }]}>📌</Text>
        <Text style={[styles.pinLabel, { color: colors.mutedForeground }]}>Decision Card</Text>
        <View style={{ flex: 1 }} />
        {/* Status badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusMeta.color + "22", borderColor: statusMeta.color + "55" },
          ]}
        >
          <Text style={styles.statusIcon}>{statusMeta.icon}</Text>
          <Text style={[styles.statusLabel, { color: statusMeta.color }]}>{statusMeta.label}</Text>
        </View>
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        {/* Type badge + timestamp */}
        <View style={styles.bodyTopRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeMeta.color + "18" }]}>
            <Text style={styles.typeIcon}>{typeMeta.icon}</Text>
            <Text style={[styles.typeLabel, { color: typeMeta.color }]}>{typeMeta.label}</Text>
          </View>
          <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>{ago}</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>{card.title}</Text>

        {/* Description */}
        {card.description ? (
          <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
            {card.description}
          </Text>
        ) : null}

        {/* Options */}
        {card.options.length > 0 && (
          <View style={[styles.optionsBox, { borderColor: colors.border }]}>
            <Text style={[styles.optionsHeading, { color: colors.mutedForeground }]}>OPTIONS</Text>
            {card.options.map((opt, i) => (
              <View
                key={i}
                style={[
                  styles.optionRow,
                  i < card.options.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.optionDot, { backgroundColor: typeMeta.color }]} />
                <Text style={[styles.optionText, { color: colors.foreground }]}>{opt}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── Action buttons ── */}
      {!isResolved ? (
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          {/* Vote */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: typeMeta.color + "18", borderColor: typeMeta.color + "40" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/group/decisions?id=${groupId}`);
            }}
            activeOpacity={0.78}
          >
            <Text style={styles.actionIcon}>🗳️</Text>
            <Text style={[styles.actionLabel, { color: typeMeta.color }]}>Vote</Text>
          </TouchableOpacity>

          {/* Discuss */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDiscuss?.();
            }}
            activeOpacity={0.78}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>Discuss</Text>
          </TouchableOpacity>

          {/* Resolve */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: "#10b98118", borderColor: "#10b98140" },
              resolving && { opacity: 0.6 },
            ]}
            onPress={handleResolve}
            disabled={resolving}
            activeOpacity={0.78}
          >
            {resolving ? (
              <ActivityIndicator size="small" color="#10b981" style={{ height: 16 }} />
            ) : (
              <>
                <Text style={styles.actionIcon}>✅</Text>
                <Text style={[styles.actionLabel, { color: "#10b981" }]}>Resolve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.resolvedBar, { borderTopColor: colors.border, backgroundColor: "#10b98112" }]}>
          <Text style={styles.resolvedText}>✅ Resolved</Text>
          <TouchableOpacity
            onPress={() => router.push(`/group/decisions?id=${groupId}`)}
            activeOpacity={0.75}
          >
            <Text style={[styles.viewLink, { color: colors.mutedForeground }]}>View details →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
    overflow: "hidden",
  },
  pinStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pinIcon: { fontSize: 12 },
  pinLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusIcon: { fontSize: 9 },
  statusLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  body: {
    padding: 14,
    gap: 8,
  },
  bodyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeIcon: { fontSize: 11 },
  typeLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  timestamp: { fontSize: 10, fontFamily: "Inter_400Regular" },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    lineHeight: 23,
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  optionsBox: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginTop: 2,
  },
  optionsHeading: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  optionText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 0,
    borderWidth: 0,
    margin: 0,
  },
  actionIcon: { fontSize: 13 },
  actionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  resolvedBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  resolvedText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#10b981",
  },
  viewLink: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
