import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Group } from "@/contexts/AppContext";

interface Props {
  group: Group;
  onPress: () => void;
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function stripMarkdown(text?: string): string {
  if (!text) return "";
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\n/g, " ");
}

export function GroupCard({ group, onPress }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}>
        {group.emoji ? (
          <Text style={styles.emoji}>{group.emoji}</Text>
        ) : (
          <Text style={[styles.initials, { color: group.color || colors.primary }]}>
            {group.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
          </Text>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatTime(group.lastMessageAt)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[styles.lastMsg, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {stripMarkdown(group.lastMessage) || `${group.memberCount} member${group.memberCount !== 1 ? "s" : ""}`}
          </Text>
          {group.unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>
                {group.unreadCount > 99 ? "99+" : group.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    flexShrink: 0,
  },
  emoji: { fontSize: 26 },
  initials: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  lastMsg: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
});
