import { Icon } from "@/components/Icon";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export interface DecisionSuggestion {
  messageId:        string;
  messageText:      string;
  matchedPhrase:    string;
  suggestedTitle:   string;
  suggestedType:    string;
  suggestedPriority: string;
}

const TYPE_ICONS: Record<string, string> = {
  restaurant: "🍽️",
  trip:       "✈️",
  event:      "🎉",
  budget:     "💰",
  meeting:    "🕐",
  task:       "✅",
  custom:     "🗳️",
};

const PRIORITY_COLORS: Record<string, string> = {
  low:    "#6b7280",
  medium: "#f59e0b",
  high:   "#f97316",
  urgent: "#ef4444",
};

function truncate(text: string, max = 70) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function DecisionSuggestionBanner({
  suggestion,
  onConfirm,
  onDismiss,
}: {
  suggestion: DecisionSuggestion;
  onConfirm:  (overrides: { title: string; description: string; decisionType: string; priority: string }) => void;
  onDismiss:  () => void;
}) {
  const colors = useColors();
  const [editing,     setEditing]     = useState(false);
  const [customTitle, setCustomTitle] = useState(suggestion.suggestedTitle);

  const typeIcon     = TYPE_ICONS[suggestion.suggestedType]         ?? "🗳️";
  const priorityColor = PRIORITY_COLORS[suggestion.suggestedPriority] ?? "#f59e0b";

  // Highlight matched phrase in excerpt
  const excerpt = truncate(suggestion.messageText);
  const phraseIdx = excerpt.toLowerCase().indexOf(suggestion.matchedPhrase.toLowerCase());

  function handleConfirm() {
    onConfirm({
      title:        customTitle.trim() || suggestion.suggestedTitle,
      description:  suggestion.messageText,
      decisionType: suggestion.suggestedType,
      priority:     suggestion.suggestedPriority,
    });
  }

  return (
    <View style={[styles.container, { borderColor: colors.primary + "40", backgroundColor: colors.primary + "08" }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.sparkle}>✨</Text>
          <Text style={[styles.headerText, { color: colors.primary }]}>
            Decision opportunity detected
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="close" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Message excerpt */}
      <View style={styles.excerptRow}>
        {phraseIdx >= 0 ? (
          <Text style={[styles.excerpt, { color: colors.foreground }]} numberOfLines={2}>
            <Text style={{ opacity: 0.6, fontStyle: "italic" }}>{excerpt.slice(0, phraseIdx)}</Text>
            <Text style={[styles.highlight, { backgroundColor: colors.primary + "30", color: colors.primary }]}>
              {excerpt.slice(phraseIdx, phraseIdx + suggestion.matchedPhrase.length)}
            </Text>
            <Text style={{ opacity: 0.6, fontStyle: "italic" }}>{excerpt.slice(phraseIdx + suggestion.matchedPhrase.length)}</Text>
          </Text>
        ) : (
          <Text style={[styles.excerpt, { color: colors.foreground, opacity: 0.7, fontStyle: "italic" }]} numberOfLines={2}>
            {excerpt}
          </Text>
        )}
      </View>

      {/* Card preview */}
      <View style={[styles.cardPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.cardIcon, { backgroundColor: colors.primary + "15" }]}>
          <Text style={{ fontSize: 18 }}>{typeIcon}</Text>
        </View>
        <View style={styles.cardInfo}>
          {editing ? (
            <TextInput
              autoFocus
              value={customTitle}
              onChangeText={setCustomTitle}
              onBlur={() => setEditing(false)}
              onSubmitEditing={() => setEditing(false)}
              style={[styles.titleInput, { color: colors.foreground, borderBottomColor: colors.primary }]}
            />
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
                {customTitle}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.cardMeta}>
            <Text style={[styles.cardMetaText, { color: colors.primary }]}>
              {suggestion.suggestedType.charAt(0).toUpperCase() + suggestion.suggestedType.slice(1)}
            </Text>
            <Text style={[styles.cardMetaDot, { color: colors.mutedForeground }]}>·</Text>
            <Text style={[styles.cardMetaText, { color: priorityColor }]}>
              {suggestion.suggestedPriority.charAt(0).toUpperCase() + suggestion.suggestedPriority.slice(1)} priority
            </Text>
            {!editing && (
              <>
                <Text style={[styles.cardMetaDot, { color: colors.mutedForeground }]}>·</Text>
                <TouchableOpacity onPress={() => setEditing(true)}>
                  <Text style={[styles.editHint, { color: colors.mutedForeground }]}>edit</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.createBtnText}>Create Decision Card</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dismissBtn, { backgroundColor: colors.secondary }]}
          onPress={onDismiss}
          activeOpacity={0.85}
        >
          <Text style={[styles.dismissBtnText, { color: colors.mutedForeground }]}>Dismiss</Text>
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
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  sparkle: { fontSize: 13 },
  headerText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  excerptRow: { marginBottom: 8 },
  excerpt: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  highlight: { fontWeight: "600", borderRadius: 3, paddingHorizontal: 2 },
  cardPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    marginBottom: 10,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shrink: 0,
  } as object,
  cardInfo: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  titleInput: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    borderBottomWidth: 1,
    paddingBottom: 2,
    marginBottom: 3,
  },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  cardMetaText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  cardMetaDot: { fontSize: 11 },
  editHint: { fontSize: 11, fontFamily: "Inter_400Regular" },
  actions: { flexDirection: "row", gap: 8 },
  createBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dismissBtn: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
