import { Icon } from "@/components/Icon";
import { Image } from "expo-image";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Message } from "@/contexts/AppContext";

interface Props {
  message: Message;
  isOwn: boolean;
  showName?: boolean;
  isLastOwn?: boolean;
  isRead?: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m} ${period}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) return formatTime(iso);
  const isYesterday =
    d.getDate() === now.getDate() - 1 &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isYesterday) return `Yesterday ${formatTime(iso)}`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + ` ${formatTime(iso)}`;
}

export function MessageBubble({ message, isOwn, showName, isLastOwn, isRead }: Props) {
  const colors = useColors();
  const imageSource = message.imageUrl || message.imageUri;

  if (message.type === "system") {
    return (
      <View style={styles.systemRow}>
        <Text style={[styles.systemText, { color: colors.mutedForeground }]}>
          {message.text}
        </Text>
      </View>
    );
  }

  if (message.type === "decision_resolution") {
    return (
      <View style={[styles.resolveCard, { backgroundColor: "#00e5bb0f", borderColor: "#00e5bb33" }]}>
        <View style={styles.resolveHeader}>
          <View style={[styles.resolveIconWrap, { backgroundColor: "#00e5bb22" }]}>
            <Text style={{ fontSize: 14 }}>📌</Text>
          </View>
          <Text style={[styles.resolveLabel, { color: "#00e5bb" }]}>Decision Saved to Memory</Text>
          <Text style={[styles.timeText, { color: colors.mutedForeground, marginLeft: "auto" as unknown as number }]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
        <Text style={[styles.resolveText, { color: colors.foreground }]}>{message.text}</Text>
      </View>
    );
  }

  if (message.type === "ai" || message.type === "recap") {
    return (
      <View
        style={[
          styles.aiContainer,
          { backgroundColor: colors.card, borderColor: colors.accent + "33", borderWidth: 1 },
        ]}
      >
        <View style={styles.aiHeader}>
          <View style={[styles.aiIcon, { backgroundColor: colors.accent + "22" }]}>
            <Icon name="sparkles" size={14} color={colors.accent} />
          </View>
          <Text style={[styles.aiLabel, { color: colors.accent }]}>AI</Text>
          <Text
            style={[
              styles.timeText,
              { color: colors.mutedForeground, marginLeft: "auto" as unknown as number },
            ]}
          >
            {formatTime(message.timestamp)}
          </Text>
        </View>
        <Text style={[styles.aiText, { color: colors.foreground }]}>{message.text}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View
        style={[
          styles.bubble,
          isOwn
            ? [styles.bubbleOwn, { backgroundColor: colors.primary }]
            : [styles.bubbleOther, { backgroundColor: colors.card }],
        ]}
      >
        {!isOwn && showName && (
          <Text style={[styles.nameText, { color: colors.accent }]}>{message.senderName}</Text>
        )}

        {imageSource ? (
          <TouchableOpacity activeOpacity={0.9}>
            <Image
              source={{ uri: imageSource }}
              style={styles.image}
              contentFit="cover"
            />
          </TouchableOpacity>
        ) : null}

        {message.text ? (
          <Text
            style={[
              styles.msgText,
              { color: isOwn ? colors.primaryForeground : colors.cardForeground },
            ]}
          >
            {message.text}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text
            style={[
              styles.timeText,
              {
                color: isOwn ? "rgba(255,255,255,0.6)" : colors.mutedForeground,
                flex: 1,
                textAlign: "right",
              },
            ]}
          >
            {formatDate(message.timestamp)}
          </Text>
          {isOwn && isLastOwn && (
            <Icon
              name={isRead ? "checkmark-done" : "checkmark"}
              size={13}
              color={isRead ? colors.accent : "rgba(255,255,255,0.5)"}
              style={styles.checkmark}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginHorizontal: 12,
    marginVertical: 3,
    flexDirection: "row",
  },
  rowOwn: { justifyContent: "flex-end" },
  rowOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleOwn: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  nameText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  msgText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 3,
  },
  timeText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  checkmark: {
    marginTop: 1,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 6,
  },
  systemRow: {
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  systemText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  resolveCard: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  resolveHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  resolveIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  resolveLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  resolveText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  aiContainer: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    padding: 14,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  aiLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  aiText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
});
