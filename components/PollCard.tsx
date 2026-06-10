import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Poll } from "@/contexts/AppContext";

interface Props {
  messageId: string;
  groupId: string;
  poll: Poll;
  currentUserId: string;
  onVote: (groupId: string, messageId: string, optionId: string) => void;
}

export function PollCard({ messageId, groupId, poll, currentUserId, onVote }: Props) {
  const colors = useColors();
  const totalVotes = poll.options.reduce((acc, o) => acc + o.votes.length, 0);
  const userVote = poll.options.find((o) => o.votes.includes(currentUserId))?.id;

  const handleVote = (optionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onVote(groupId, messageId, optionId);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.question, { color: colors.foreground }]}>{poll.question}</Text>
      <View style={styles.options}>
        {poll.options.map((option) => {
          const pct = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
          const isSelected = userVote === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option]}
              onPress={() => handleVote(option.id)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.optionTrack,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + "22"
                      : colors.muted,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: 1.5,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionFill,
                    {
                      width: `${pct}%` as any,
                      backgroundColor: isSelected
                        ? colors.primary + "44"
                        : colors.secondary,
                    },
                  ]}
                />
                <View style={styles.optionContent}>
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isSelected ? colors.primary : colors.foreground,
                        fontFamily: isSelected
                          ? "Inter_600SemiBold"
                          : "Inter_400Regular",
                      },
                    ]}
                  >
                    {option.text}
                  </Text>
                  <Text style={[styles.pctText, { color: colors.mutedForeground }]}>
                    {pct}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[styles.total, { color: colors.mutedForeground }]}>
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  question: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
    lineHeight: 22,
  },
  options: {
    gap: 8,
  },
  option: {
    borderRadius: 12,
    overflow: "hidden",
  },
  optionTrack: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    minHeight: 48,
  },
  optionFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 12,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  optionText: {
    fontSize: 15,
    flex: 1,
  },
  pctText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginLeft: 8,
  },
  total: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 10,
    textAlign: "right",
  },
});
