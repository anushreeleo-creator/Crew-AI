import { Icon } from "@/components/Icon";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useColors } from "@/hooks/useColors";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DecisionStatus   = "pending" | "voting" | "approved" | "completed" | "cancelled";
export type DecisionType     = "restaurant" | "trip" | "event" | "budget" | "meeting" | "task" | "custom";
export type DecisionPriority = "low" | "medium" | "high" | "urgent";

export interface DecisionCard {
  id:            string;
  title:         string;
  description:   string;
  status:        DecisionStatus;
  decisionType:  DecisionType;
  createdBy?:    string | null;
  assignedTo?:   string | null;
  priority:      DecisionPriority;
  dueDate?:      string | null;
  resolvedAt?:   string | null;
  metadataJson?: Record<string, unknown> | null;
  createdAt:     string;
  updatedAt:     string;
}

interface CardMeta {
  options?:      string[];
  votes?:        Record<string, number>;
  participants?: string[];
  totalVoters?:  number;
  resolution?:   {
    selectedOption?:  string;
    date?:            string;
    time?:            string;
    participantCount?: number;
  };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const STATUS_META: Record<DecisionStatus, { label: string; color: string; icon: string }> = {
  pending:   { label: "Pending",   color: "#f59e0b", icon: "⏳" },
  voting:    { label: "Voting",    color: "#3b82f6", icon: "🗳️" },
  approved:  { label: "Approved",  color: "#10b981", icon: "✅" },
  completed: { label: "Completed", color: "#6366f1", icon: "🏁" },
  cancelled: { label: "Cancelled", color: "#6b7280", icon: "🚫" },
};

export const TYPE_META: Record<DecisionType, { label: string; color: string; icon: string }> = {
  restaurant: { label: "Restaurant", color: "#f59e0b", icon: "🍽️" },
  trip:       { label: "Trip",       color: "#3b82f6", icon: "✈️" },
  event:      { label: "Event",      color: "#ec4899", icon: "🎉" },
  budget:     { label: "Budget",     color: "#10b981", icon: "💰" },
  meeting:    { label: "Meeting",    color: "#8b5cf6", icon: "🕐" },
  task:       { label: "Task",       color: "#00e5bb", icon: "✅" },
  custom:     { label: "Decision",   color: "#7c6bff", icon: "🗳️" },
};

export const PRIORITY_META: Record<DecisionPriority, { label: string; color: string }> = {
  low:    { label: "Low",    color: "#6b7280" },
  medium: { label: "Medium", color: "#f59e0b" },
  high:   { label: "High",   color: "#f97316" },
  urgent: { label: "Urgent", color: "#ef4444" },
};

export const DECISION_TYPES      = Object.keys(TYPE_META)     as DecisionType[];
export const DECISION_STATUSES   = Object.keys(STATUS_META)   as DecisionStatus[];
export const DECISION_PRIORITIES = Object.keys(PRIORITY_META) as DecisionPriority[];

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)         return "just now";
  if (diff < 3_600_000)      return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)     return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DecisionCardItem({
  card,
  onDelete,
  onStatusChange,
  onFinalize,
}: {
  card:            DecisionCard;
  onDelete:        (id: string) => void;
  onStatusChange:  (id: string, status: DecisionStatus) => void;
  onFinalize?:     (card: DecisionCard) => void;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const statusMeta   = STATUS_META[card.status];
  const typeMeta     = TYPE_META[card.decisionType];
  const priorityMeta = PRIORITY_META[card.priority];

  const meta: CardMeta = (card.metadataJson ?? {}) as CardMeta;
  const options      = meta.options      ?? [];
  const votes        = meta.votes        ?? {};
  const participants = meta.participants ?? [];
  const totalVoters  = meta.totalVoters  ?? participants.length;
  const votedCount   = options.reduce((s, o) => s + (votes[o] ?? 0), 0);
  const maxVotes     = options.length
    ? Math.max(...options.map((o) => votes[o] ?? 0), 1)
    : 1;

  function handleDeletePress() {
    if (Platform.OS === "web") { onDelete(card.id); return; }
    Alert.alert("Remove Decision", `Remove "${card.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => onDelete(card.id) },
    ]);
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

      {/* ── Colored top accent (breaks out of card padding with negative margin) ── */}
      <View style={[styles.accentBar, { backgroundColor: typeMeta.color }]} />

      {/* ── Top row: delete ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleDeletePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginLeft: "auto" as unknown as number }}>
          <Icon name="close-circle-outline" size={19} color={colors.mutedForeground + "80"} />
        </TouchableOpacity>
      </View>

      {/* ── Title ── */}
      <Text style={[styles.title, { color: colors.foreground }]}>{card.title}</Text>

      {/* ── Description ── */}
      <Text
        style={[styles.description, { color: colors.foreground + "aa" }]}
        numberOfLines={expanded ? undefined : 2}
      >
        {card.description}
      </Text>

      {/* ── Meta row ── */}
      <View style={styles.infoRow}>
        <Icon name="time-outline" size={11} color={colors.mutedForeground} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{relativeTime(card.createdAt)}</Text>
        {card.assignedTo && (
          <>
            <Text style={[styles.infoDot, { color: colors.mutedForeground }]}>·</Text>
            <Icon name="person-outline" size={11} color={colors.mutedForeground} />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{card.assignedTo}</Text>
          </>
        )}
        {card.dueDate && (
          <>
            <Text style={[styles.infoDot, { color: colors.mutedForeground }]}>·</Text>
            <Icon name="calendar-outline" size={11} color={colors.mutedForeground} />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              {new Date(card.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </Text>
          </>
        )}
      </View>

      {/* ── View Details toggle ── */}
      <TouchableOpacity
        style={[styles.viewDetailsRow, { borderTopColor: colors.border }]}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
      >
        <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
          {expanded ? "Collapse" : "View Details"}
        </Text>
        <Icon
          name={expanded ? "chevron-up" : "chevron-forward"}
          size={13}
          color={colors.primary}
        />
      </TouchableOpacity>

      {/* ── Expanded details ── */}
      {expanded && (
        <View style={[styles.detailsPanel, { borderTopColor: colors.border }]}>

          {/* Poll Results */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>POLL RESULTS</Text>
          {options.length > 0 ? (
            <View style={[styles.optionsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {options.map((opt, i) => {
                const count  = votes[opt] ?? 0;
                const barPct = maxVotes > 0 ? count / maxVotes : 0;
                const isTop  = count > 0 && count === Math.max(...options.map((o) => votes[o] ?? 0));
                return (
                  <View key={opt} style={[styles.optionRow, i < options.length - 1 && styles.optionRowBorder, { borderColor: colors.border + "60" }]}>
                    <View style={styles.optionLabelRow}>
                      <Text style={[styles.optionLabel, { color: colors.foreground }]} numberOfLines={1}>
                        {isTop && <Text style={{ color: typeMeta.color }}>● </Text>}
                        {opt}
                      </Text>
                      <Text style={[styles.optionCount, { color: count > 0 ? typeMeta.color : colors.mutedForeground }]}>
                        {count}
                      </Text>
                    </View>
                    <View style={[styles.voteBarTrack, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.voteBarFill,
                          {
                            width: `${Math.round(barPct * 100)}%`,
                            backgroundColor: isTop ? typeMeta.color : typeMeta.color + "55",
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
              {totalVoters > 0 && (
                <View style={styles.voteSummaryRow}>
                  <View style={[styles.voteSummaryBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.voteSummaryFill,
                        { width: `${Math.round((votedCount / totalVoters) * 100)}%`, backgroundColor: typeMeta.color },
                      ]}
                    />
                  </View>
                  <Text style={[styles.voteSummaryLabel, { color: colors.mutedForeground }]}>
                    {votedCount} of {totalVoters} voted
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={[styles.emptyDetail, { color: colors.mutedForeground }]}>No poll data for this decision.</Text>
          )}

          {/* Resolution */}
          {(card.status === "approved" || card.status === "completed") && meta.resolution && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 14 }]}>DECISION MADE</Text>
              <View style={[styles.resolutionBox, { backgroundColor: typeMeta.color + "12", borderColor: typeMeta.color + "40" }]}>
                {!!meta.resolution.selectedOption && (
                  <Text style={[styles.resolutionChoice, { color: colors.foreground }]}>
                    {meta.resolution.selectedOption}
                  </Text>
                )}
                {!!(meta.resolution.date || meta.resolution.time) && (
                  <Text style={[styles.resolutionDetail, { color: colors.mutedForeground }]}>
                    📅 {[meta.resolution.date, meta.resolution.time].filter(Boolean).join(" at ")}
                  </Text>
                )}
                {!!meta.resolution.participantCount && (
                  <Text style={[styles.resolutionDetail, { color: colors.mutedForeground }]}>
                    👥 {meta.resolution.participantCount} participants
                  </Text>
                )}
              </View>
            </>
          )}

          {/* Attendees */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 14 }]}>ATTENDEES</Text>
          {participants.length > 0 ? (
            <View style={styles.participantsRow}>
              {participants.slice(0, 8).map((p, i) => (
                <View
                  key={i}
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: colors.primary + "25",
                      borderColor: colors.card,
                      zIndex: participants.length - i,
                      marginLeft: i === 0 ? 0 : -10,
                    },
                  ]}
                >
                  <Text style={styles.avatarText}>{p}</Text>
                </View>
              ))}
              {participants.length > 8 && (
                <View style={[styles.avatar, { backgroundColor: colors.card, borderColor: colors.border, marginLeft: -10 }]}>
                  <Text style={[styles.avatarMoreText, { color: colors.mutedForeground }]}>+{participants.length - 8}</Text>
                </View>
              )}
              <Text style={[styles.attendeeCount, { color: colors.mutedForeground }]}>
                {participants.length} {participants.length === 1 ? "person" : "people"}
              </Text>
            </View>
          ) : (
            <Text style={[styles.emptyDetail, { color: colors.mutedForeground }]}>No attendees recorded yet.</Text>
          )}

        </View>
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  // Top color accent
  accentBar: { height: 3, marginHorizontal: -14, marginTop: -14, marginBottom: 2 },

  // Top bar
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  // Text
  title: { fontSize: 17, fontFamily: "Inter_700Bold", lineHeight: 22, letterSpacing: -0.3 },
  description: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

  // Info row
  infoRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 },
  infoText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  infoDot: { fontSize: 11 },

  // View Details toggle
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 12,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  viewDetailsText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // Expanded details panel
  detailsPanel: {
    gap: 8,
    paddingTop: 14,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  emptyDetail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    paddingVertical: 6,
  },

  // Options / poll
  optionsBox: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 8,
  },
  optionsSectionHeader: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  optionRow: { gap: 5 },
  optionRowBorder: { paddingBottom: 8 },
  optionLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  optionLabel: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  optionCount: { fontSize: 12, fontFamily: "Inter_700Bold", minWidth: 18, textAlign: "right" },
  voteBarTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  voteBarFill: { height: "100%" as unknown as number, borderRadius: 3 },
  voteSummaryRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  voteSummaryBar: { flex: 1, height: 3, borderRadius: 2, overflow: "hidden" },
  voteSummaryFill: { height: "100%" as unknown as number, borderRadius: 2, opacity: 0.5 },
  voteSummaryLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },

  // Resolution
  resolutionBox: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 5 },
  resolutionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  resolutionTick: { fontSize: 15 },
  resolutionHeading: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  resolutionChoice: { fontSize: 15, fontFamily: "Inter_700Bold", lineHeight: 20 },
  resolutionDetail: { fontSize: 12, fontFamily: "Inter_400Regular" },

  // Participants / attendees
  participantsRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarText: { fontSize: 17 },
  avatarMore: {},
  avatarMoreText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  attendeeCount: { fontSize: 12, fontFamily: "Inter_400Regular", marginLeft: 6 },

});
