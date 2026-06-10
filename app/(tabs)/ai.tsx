import { Icon } from "@/components/Icon";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const QUICK_PROMPTS = [
  { icon: "document-text-outline" as const, label: "Summarize", hint: "Get a recap of recent activity", msg: "@AI summarize our recent chat" },
  { icon: "stats-chart-outline" as const, label: "Create Poll", hint: "Vote on group decisions", msg: "@AI create a poll" },
  { icon: "calendar-outline" as const, label: "Plan Event", hint: "Coordinate schedules", msg: "@AI help us plan an event" },
  { icon: "checkmark-circle-outline" as const, label: "Decide", hint: "Help reach a group decision", msg: "@AI help us make a group decision" },
];

export default function AIScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { groups } = useApp();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    groups[0]?.id ?? null,
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const handleQuickAction = (msg: string) => {
    if (!selectedGroupId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/group/[id]",
      params: { id: selectedGroupId, prefill: msg },
    });
  };

  const handleSmartSummaries = () => {
    if (!selectedGroupId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/group/summaries?id=${selectedGroupId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Powered by AI</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Assistant</Text>
        </View>
        <View style={[styles.aiIcon, { backgroundColor: colors.accent + "20", borderColor: colors.accent + "40" }]}>
          <Icon name="sparkles" size={22} color={colors.accent} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 80 }}
      >
        {groups.length === 0 ? (
          <View style={styles.noGroups}>
            <Icon name="people-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.noGroupsText, { color: colors.mutedForeground }]}>
              Create or join a crew to use the AI assistant
            </Text>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/group/create")}
            >
              <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>
                Create a Crew
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SELECT CREW</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupPills}>
                {groups.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.groupPill,
                      {
                        backgroundColor: selectedGroupId === g.id ? g.color : colors.secondary,
                        borderColor: selectedGroupId === g.id ? g.color : colors.border,
                      },
                    ]}
                    onPress={() => { setSelectedGroupId(g.id); Haptics.selectionAsync(); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.groupPillText, { color: selectedGroupId === g.id ? "#fff" : colors.foreground }]}>
                      {g.emoji ? `${g.emoji} ` : ""}{g.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>QUICK ACTIONS</Text>
              <View style={styles.actionsGrid}>
                {QUICK_PROMPTS.map((p) => (
                  <TouchableOpacity
                    key={p.label}
                    style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleQuickAction(p.msg)}
                    activeOpacity={0.75}
                    disabled={!selectedGroupId}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: colors.accent + "18" }]}>
                      <Icon name={p.icon} size={22} color={colors.accent} />
                    </View>
                    <Text style={[styles.actionLabel, { color: colors.foreground }]}>{p.label}</Text>
                    <Text style={[styles.actionHint, { color: colors.mutedForeground }]}>{p.hint}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedGroup && (
              <View style={[styles.recapSection, { paddingHorizontal: 16 }]}>
                <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SMART SUMMARIES</Text>
                <TouchableOpacity
                  style={[styles.recapBtn, { backgroundColor: colors.card, borderColor: colors.accent + "44" }]}
                  onPress={handleSmartSummaries}
                  activeOpacity={0.8}
                >
                  <View style={styles.recapBtnLeft}>
                    <Icon name="sparkles" size={20} color={colors.accent} />
                    <View>
                      <Text style={[styles.recapBtnTitle, { color: colors.foreground }]}>
                        View summaries for {selectedGroup.emoji ? `${selectedGroup.emoji} ` : ""}{selectedGroup.name}
                      </Text>
                      <Text style={[styles.recapBtnSub, { color: colors.mutedForeground }]}>
                        Daily briefs, weekly recaps & missed messages
                      </Text>
                    </View>
                  </View>
                  <Icon name="chevron-forward" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.tipsSection}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground, paddingHorizontal: 20 }]}>
                AI TIPS
              </Text>
              {[
                { tip: 'Tag @AI in any group chat to get instant help', icon: "at-outline" as const },
                { tip: '"@AI create a poll: sushi or tacos?" — gets instant vote', icon: "stats-chart-outline" as const },
                { tip: '"@AI summarize" — catch up on missed messages', icon: "document-text-outline" as const },
              ].map((t, i) => (
                <View key={i} style={[styles.tipRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.tipIcon, { backgroundColor: colors.muted }]}>
                    <Icon name={t.icon} size={16} color={colors.mutedForeground} />
                  </View>
                  <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{t.tip}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  noGroups: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 16,
  },
  noGroupsText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  createBtn: {
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
  },
  createBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  section: { paddingTop: 20, gap: 10 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, paddingHorizontal: 20 },
  groupPills: { paddingHorizontal: 16, gap: 8 },
  groupPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  groupPillText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 8,
  },
  actionCard: {
    width: "47%",
    marginHorizontal: "1.5%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  actionHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  recapSection: { paddingTop: 20, gap: 10 },
  recapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  recapBtnLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  recapBtnTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  recapBtnSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  tipsSection: { paddingTop: 24 },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
});
