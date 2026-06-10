import { Icon } from "@/components/Icon";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  useSummaries,
  type GroupSummary,
  type SummaryType,
} from "@/hooks/useSummaries";

const TABS: { key: SummaryType; label: string; icon: string }[] = [
  { key: "daily", label: "Daily Brief", icon: "sunny-outline" },
  { key: "weekly", label: "Weekly Recap", icon: "calendar-outline" },
  { key: "missed", label: "Missed", icon: "time-outline" },
];

const SECTION_META: {
  key: keyof GroupSummary["sections"];
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: "topics", label: "Topics Discussed", icon: "chatbubbles-outline", color: "#7c6bff" },
  { key: "decisions", label: "Decisions Made", icon: "checkmark-circle-outline", color: "#10b981" },
  { key: "actionItems", label: "Action Items", icon: "flash-outline", color: "#f59e0b" },
  { key: "openQuestions", label: "Open Questions", icon: "help-circle-outline", color: "#3b82f6" },
  { key: "upcomingEvents", label: "Upcoming Events", icon: "calendar-outline", color: "#ec4899" },
];

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function SummaryCard({ summary, colors }: { summary: GroupSummary; colors: ReturnType<typeof useColors> }) {
  const [expanded, setExpanded] = useState(true);

  const nonEmpty = SECTION_META.filter(
    (s) => (summary.sections[s.key]?.length ?? 0) > 0,
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Text style={[styles.cardTime, { color: colors.mutedForeground }]}>
            Generated {formatRelative(summary.generatedAt)} • {summary.messageCount} messages
          </Text>
        </View>
        <Icon
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>
          {nonEmpty.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nothing notable in this period.
            </Text>
          ) : (
            nonEmpty.map((meta) => {
              const items = summary.sections[meta.key] as string[];
              return (
                <View key={meta.key} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIcon, { backgroundColor: meta.color + "18" }]}>
                      <Icon name={meta.icon} size={13} color={meta.color} />
                    </View>
                    <Text style={[styles.sectionLabel, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                  {items.map((item, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.dot, { backgroundColor: meta.color }]} />
                      <Text style={[styles.bulletText, { color: colors.foreground }]}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

function EmptyTab({
  type,
  isGenerating,
  onGenerate,
  colors,
}: {
  type: SummaryType;
  isGenerating: boolean;
  onGenerate: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const tab = TABS.find((t) => t.key === type)!;
  return (
    <View style={styles.emptyTab}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "25" }]}>
        <Icon name={tab.icon} size={32} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        No {tab.label} yet
      </Text>
      <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
        {type === "daily"
          ? "Auto-generates after every 20 messages, or tap below."
          : type === "weekly"
          ? "Auto-generates after every 100 messages, or tap below."
          : "Generate a summary of messages you missed."}
      </Text>
      <TouchableOpacity
        style={[styles.generateBtn, { backgroundColor: colors.primary }]}
        onPress={onGenerate}
        disabled={isGenerating}
        activeOpacity={0.8}
      >
        {isGenerating ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Icon name="sparkles-outline" size={16} color="#fff" />
            <Text style={styles.generateBtnText}>Generate Now</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function GroupSummariesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { summaries, isLoading, isGenerating, fetchSummaries, generate } =
    useSummaries(id ?? "");
  const [activeTab, setActiveTab] = useState<SummaryType>("daily");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void fetchSummaries(); }, [id]);

  const tabSummaries = [...summaries]
    .filter((s) => s.type === activeTab)
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Smart Summaries
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push(`/group/summary-settings?id=${id}`)}
        >
          <Icon name="settings-outline" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = summaries.filter((s) => s.type === tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Icon
                name={tab.icon}
                size={15}
                color={isActive ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.primary : colors.mutedForeground },
                  isActive && { fontFamily: "Inter_600SemiBold" },
                ]}
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.tabBadgeText, { color: colors.primary }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : tabSummaries.length === 0 ? (
        <EmptyTab
          type={activeTab}
          isGenerating={isGenerating}
          onGenerate={() => generate(activeTab)}
          colors={colors}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: botPad + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[
              styles.refreshRow,
              { backgroundColor: colors.primary + "12", borderColor: colors.primary + "20" },
            ]}
            onPress={() => generate(activeTab)}
            disabled={isGenerating}
            activeOpacity={0.7}
          >
            {isGenerating ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Icon name="sparkles-outline" size={15} color={colors.primary} />
            )}
            <Text style={[styles.refreshText, { color: colors.primary }]}>
              {isGenerating ? "Generating…" : "Regenerate Summary"}
            </Text>
          </TouchableOpacity>

          {tabSummaries.map((summary) => (
            <SummaryCard key={summary.id} summary={summary} colors={colors} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: { padding: 4 },
  settingsBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tabBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  tabBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  emptyTitle: { fontSize: 19, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 4,
    minWidth: 160,
    justifyContent: "center",
  },
  generateBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    justifyContent: "center",
  },
  refreshText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  cardHeaderLeft: { flex: 1 },
  cardTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 12 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  section: { gap: 6 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    paddingLeft: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
});
