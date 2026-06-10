import { Icon } from "@/components/Icon";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSummaries, type SummaryMode } from "@/hooks/useSummaries";

const MODES: {
  key: SummaryMode;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    key: "off",
    label: "Off",
    description: "No summaries generated",
    icon: "close-circle-outline",
  },
  {
    key: "decisions_only",
    label: "Important Decisions Only",
    description: "Only decisions and action items",
    icon: "checkmark-circle-outline",
  },
  {
    key: "full",
    label: "Full Summary",
    description: "All sections: topics, decisions, actions, events",
    icon: "list-outline",
  },
  {
    key: "personalized",
    label: "Personalized Summary",
    description: "Detailed summaries with context and who's involved",
    icon: "sparkles-outline",
  },
];

export default function SummarySettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { settings, fetchSettings, updateSettings } = useSummaries(id ?? "");

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (!settings) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
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
            paddingTop: topPad + 8,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Summary Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: botPad + 32, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            SUMMARY DETAIL
          </Text>
          <View style={[styles.modeList, { borderColor: colors.border, backgroundColor: colors.card }]}>
            {MODES.map((mode, i) => {
              const isSelected = settings.mode === mode.key;
              return (
                <TouchableOpacity
                  key={mode.key}
                  style={[
                    styles.modeRow,
                    i < MODES.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => updateSettings({ mode: mode.key })}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.modeIconWrap,
                      {
                        backgroundColor: isSelected
                          ? colors.primary + "20"
                          : colors.background,
                      },
                    ]}
                  >
                    <Icon
                      name={mode.icon}
                      size={18}
                      color={isSelected ? colors.primary : colors.mutedForeground}
                    />
                  </View>
                  <View style={styles.modeText}>
                    <Text
                      style={[
                        styles.modeLabel,
                        {
                          color: isSelected ? colors.primary : colors.foreground,
                          fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
                        },
                      ]}
                    >
                      {mode.label}
                    </Text>
                    <Text style={[styles.modeDesc, { color: colors.mutedForeground }]}>
                      {mode.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <Icon name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {settings.mode !== "off" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              SUMMARY TYPES
            </Text>
            <View style={[styles.toggleList, { borderColor: colors.border, backgroundColor: colors.card }]}>
              {[
                {
                  key: "daily" as const,
                  label: "Daily Brief",
                  desc: "Auto-generates every 20 messages",
                  icon: "sunny-outline" as const,
                },
                {
                  key: "weekly" as const,
                  label: "Weekly Recap",
                  desc: "Auto-generates every 100 messages",
                  icon: "calendar-outline" as const,
                },
                {
                  key: "missed" as const,
                  label: "Missed Messages",
                  desc: "Generate on demand when you return",
                  icon: "time-outline" as const,
                },
              ].map((item, i, arr) => (
                <View
                  key={item.key}
                  style={[
                    styles.toggleRow,
                    i < arr.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.toggleIcon, { backgroundColor: colors.background }]}>
                    <Icon name={item.icon} size={16} color={colors.mutedForeground} />
                  </View>
                  <View style={styles.toggleText}>
                    <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.toggleDesc, { color: colors.mutedForeground }]}>
                      {item.desc}
                    </Text>
                  </View>
                  <Switch
                    value={settings[item.key]}
                    onValueChange={(val) => updateSettings({ [item.key]: val })}
                    trackColor={{ false: colors.border, true: colors.primary + "80" }}
                    thumbColor={settings[item.key] ? colors.primary : colors.mutedForeground}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        <View
          style={[
            styles.infoBox,
            { backgroundColor: colors.primary + "0e", borderColor: colors.primary + "25" },
          ]}
        >
          <Icon name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Summaries are AI-generated from your group's messages. They're stored per group and
            only visible to group members.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  modeList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  modeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modeText: { flex: 1, gap: 2 },
  modeLabel: { fontSize: 15 },
  modeDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  toggleList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  toggleIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  toggleDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
