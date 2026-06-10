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
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMemories, type GroupMemory, type MemoryCategory } from "@/hooks/useMemories";

const CATEGORY_META: Record<
  MemoryCategory,
  { label: string; icon: string; color: string }
> = {
  decision: { label: "Decisions", icon: "checkmark-circle-outline", color: "#7c6bff" },
  food: { label: "Food & Dining", icon: "restaurant-outline", color: "#f59e0b" },
  budget: { label: "Budget", icon: "wallet-outline", color: "#10b981" },
  travel: { label: "Travel", icon: "airplane-outline", color: "#3b82f6" },
  event: { label: "Events", icon: "calendar-outline", color: "#ec4899" },
  fact: { label: "Facts", icon: "information-circle-outline", color: "#00e5bb" },
};

function MemoryCard({
  memory,
  onDelete,
}: {
  memory: GroupMemory;
  onDelete: (id: string) => void;
}) {
  const colors = useColors();
  const meta = CATEGORY_META[memory.category];

  const handleDelete = () => {
    if (Platform.OS === "web") {
      onDelete(memory.id);
      return;
    }
    Alert.alert("Remove Memory", `Remove this memory?\n\n"${memory.content}"`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => onDelete(memory.id) },
    ]);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.cardIcon, { backgroundColor: meta.color + "20" }]}>
        <Icon name={meta.icon} size={16} color={meta.color} />
      </View>
      <Text style={[styles.cardText, { color: colors.foreground }]}>{memory.content}</Text>
      <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="close-circle-outline" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

export default function GroupMemoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { memories, isLoading, fetch, deleteMemory } = useMemories(id ?? "");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void fetch(); }, [id]);

  const grouped = React.useMemo(() => {
    const map: Partial<Record<MemoryCategory, GroupMemory[]>> = {};
    for (const m of memories) {
      if (!map[m.category]) map[m.category] = [];
      map[m.category]!.push(m);
    }
    return map;
  }, [memories]);

  const categories = (Object.keys(CATEGORY_META) as MemoryCategory[]).filter(
    (c) => (grouped[c]?.length ?? 0) > 0,
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Group Memory</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {memories.length} {memories.length === 1 ? "memory" : "memories"}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetch}>
          <Icon name="refresh-outline" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : memories.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
            <Icon name="bulb-outline" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No memories yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Chat with @AI and I'll automatically{"\n"}learn your group's preferences.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: botPad + 24, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.infoBar, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "25" }]}>
            <Icon name="sparkles-outline" size={14} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              AI uses these memories to personalize responses
            </Text>
          </View>

          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const items = grouped[cat]!;
            return (
              <View key={cat} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: meta.color + "18" }]}>
                    <Icon name={meta.icon} size={14} color={meta.color} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                    {meta.label.toUpperCase()}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: meta.color + "20" }]}>
                    <Text style={[styles.badgeText, { color: meta.color }]}>{items.length}</Text>
                  </View>
                </View>
                {items.map((m) => (
                  <MemoryCard key={m.id} memory={m} onDelete={deleteMemory} />
                ))}
              </View>
            );
          })}
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
  refreshBtn: { padding: 4 },
  headerCenter: { flex: 1, gap: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  section: { marginBottom: 8, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  cardIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
