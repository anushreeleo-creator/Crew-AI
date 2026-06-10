import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuthFetch } from "@/hooks/useAuthFetch";

export interface ConsensusData {
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

interface Props {
  consensus: ConsensusData;
  onDismiss: () => void;
  onSaved: () => void;
  onVoteUpdate?: (update: { yesVotes: number; noVotes: number; myVote: "confirm" | "reject" }) => void;
}

export function ConsensusCard({ consensus, onDismiss, onSaved, onVoteUpdate }: Props) {
  const colors = useColors();
  const authFetch = useAuthFetch();
  const [voting, setVoting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [polling, setPolling] = useState(false);

  const {
    detectionId, groupId, topic, recommendedOutcome, confidenceScore,
    supportCount, yesVotes, noVotes, totalMembers, myVote,
  } = consensus;

  const threshold = Math.ceil(Math.max(totalMembers, 1) / 2);
  const votePct = totalMembers > 0 ? Math.min(100, (yesVotes / totalMembers) * 100) : 0;
  const totalVotes = yesVotes + noVotes;

  const confidenceColor =
    confidenceScore >= 85 ? "#00e5bb" :
    confidenceScore >= 70 ? "#7c6bff" :
    "#f59e0b";

  async function handleVote(vote: "confirm" | "reject") {
    if (myVote || voting) return;
    setVoting(true);
    try {
      const res = await authFetch(`/groups/${groupId}/consensus/${detectionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      if (res.ok) {
        const json = (await res.json()) as {
          yesVotes: number; noVotes: number; autoResolved?: boolean;
        };
        onVoteUpdate?.({ yesVotes: json.yesVotes, noVotes: json.noVotes, myVote: vote });
        if (json.autoResolved) {
          if (vote === "confirm") onSaved();
          else onDismiss();
        }
      }
    } finally {
      setVoting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await authFetch(`/groups/${groupId}/consensus/${detectionId}/save`, {
        method: "POST",
      });
      if (res.ok) {
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handlePoll() {
    setPolling(true);
    try {
      const res = await authFetch(`/groups/${groupId}/consensus/${detectionId}/poll`, {
        method: "POST",
      });
      if (res.ok) {
        onDismiss();
      }
    } finally {
      setPolling(false);
    }
  }

  async function handleDismiss() {
    await authFetch(`/groups/${groupId}/consensus/${detectionId}/dismiss`, { method: "POST" }).catch(() => {});
    onDismiss();
  }

  return (
    <View style={[styles.container, { borderColor: "rgba(124,107,255,0.35)" }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={styles.headerIcon}>✨</Text>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Consensus Detected</Text>
        <TouchableOpacity onPress={() => void handleDismiss()} style={styles.closeBtn}>
          <Text style={[styles.closeText, { color: colors.mutedForeground }]}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>TOPIC</Text>
          <Text style={[styles.dot, { color: colors.mutedForeground }]}> · </Text>
          <Text style={[styles.label, { color: confidenceColor }]}>{confidenceScore}% CONFIDENCE</Text>
        </View>
        <Text style={[styles.value, { color: colors.foreground }]}>{topic}</Text>

        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 10 }]}>PROPOSED OUTCOME</Text>
        <Text style={[styles.outcome, { color: colors.foreground }]}>{recommendedOutcome}</Text>

        <Text style={[styles.supportText, { color: colors.mutedForeground }]}>
          {supportCount} member{supportCount !== 1 ? "s" : ""} in agreement in chat
        </Text>

        {/* Vote progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.foreground }]}>
              {yesVotes} of {threshold} votes needed
            </Text>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              {totalVotes} voted
            </Text>
          </View>
          <View style={[styles.barBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${votePct}%` as unknown as number,
                  backgroundColor: yesVotes >= threshold ? "#00e5bb" : "#7c6bff",
                },
              ]}
            />
          </View>
          {totalVotes > 0 && (
            <View style={styles.voteCountRow}>
              <Text style={[styles.voteCountText, { color: "#00e5bb" }]}>✅ {yesVotes} confirm</Text>
              <Text style={[styles.voteCountText, { color: "#f87171" }]}>❌ {noVotes} no thanks</Text>
            </View>
          )}
        </View>

        {/* Voting UI */}
        {myVote ? (
          <View style={[styles.votedBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={styles.votedIcon}>{myVote === "confirm" ? "✅" : "❌"}</Text>
            <Text style={[styles.votedText, { color: colors.mutedForeground }]}>
              {"You voted "}
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>
                {myVote === "confirm" ? "Confirm" : "No thanks"}
              </Text>
              {" · waiting for others…"}
            </Text>
          </View>
        ) : (
          <View style={styles.voteButtons}>
            <TouchableOpacity
              style={[styles.voteBtn, styles.confirmBtn]}
              onPress={() => void handleVote("confirm")}
              disabled={voting}
            >
              {voting ? (
                <ActivityIndicator size="small" color="#00e5bb" />
              ) : (
                <Text style={[styles.voteBtnText, { color: "#00e5bb" }]}>✅ Confirm</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.voteBtn, styles.rejectBtn]}
              onPress={() => void handleVote("reject")}
              disabled={voting}
            >
              {voting ? (
                <ActivityIndicator size="small" color="#f87171" />
              ) : (
                <Text style={[styles.voteBtnText, { color: "#f87171" }]}>❌ No thanks</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnBorder, { borderRightColor: colors.border }]}
          onPress={() => void handleSave()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#00e5bb" />
          ) : (
            <Text style={[styles.actionText, { color: "#00e5bb" }]}>📌 Save</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnBorder, { borderRightColor: colors.border }]}
          onPress={() => void handlePoll()}
          disabled={polling}
        >
          {polling ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.actionText, { color: colors.primary }]}>🗳️ Put to Vote</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => void handleDismiss()}
        >
          <Text style={[styles.actionText, { color: colors.mutedForeground }]}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(124,107,255,0.06)",
    shadowColor: "#7c6bff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    backgroundColor: "rgba(124,107,255,0.05)",
  },
  headerIcon: { fontSize: 14 },
  headerTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 20, lineHeight: 22 },
  body: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  dot: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  label: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  value: { fontSize: 14, fontFamily: "Inter_500Medium" },
  outcome: { fontSize: 17, fontFamily: "Inter_700Bold", lineHeight: 22 },
  supportText: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4, marginBottom: 8 },
  progressSection: { marginBottom: 12 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  barBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  voteCountRow: { flexDirection: "row", gap: 12, marginTop: 5 },
  voteCountText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  voteButtons: { flexDirection: "row", gap: 8 },
  voteBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  confirmBtn: {
    backgroundColor: "rgba(0,229,187,0.10)",
    borderColor: "rgba(0,229,187,0.30)",
  },
  rejectBtn: {
    backgroundColor: "rgba(248,113,113,0.08)",
    borderColor: "rgba(248,113,113,0.20)",
  },
  voteBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  votedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  votedIcon: { fontSize: 16 },
  votedText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    backgroundColor: "rgba(124,107,255,0.03)",
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  actionBtnBorder: {
    borderRightWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
