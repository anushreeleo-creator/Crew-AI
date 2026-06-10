import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@clerk/expo";
import { useColors } from "@/hooks/useColors";
import { useAuthFetch } from "@/hooks/useAuthFetch";

interface TimelineDecision {
  id: string;
  title: string;
  description: string;
  decisionType: string;
  status: string;
  createdAt: string;
}

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  restaurant: { icon: "🍽️", color: "#f97316", label: "Dinner"   },
  trip:       { icon: "✈️",  color: "#8b5cf6", label: "Trip"     },
  event:      { icon: "🎉",  color: "#ec4899", label: "Event"    },
  budget:     { icon: "💰",  color: "#10b981", label: "Budget"   },
  meeting:    { icon: "📅",  color: "#3b82f6", label: "Meeting"  },
  task:       { icon: "✅",  color: "#6366f1", label: "Task"     },
  custom:     { icon: "📌",  color: "#7c6bff", label: "Decision" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

interface Props {
  groupId: string;
  insets: { bottom: number };
}

export function DecisionTimeline({ groupId, insets }: Props) {
  const colors    = useColors();
  const { isLoaded } = useAuth();
  const authFetch = useAuthFetch();
  const authFetchRef = useRef(authFetch);
  authFetchRef.current = authFetch;

  const [decisions,   setDecisions]   = useState<TimelineDecision[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterType,  setFilterType]  = useState("all");

  useEffect(() => {
    if (!isLoaded || !groupId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await authFetchRef.current(`/groups/${groupId}/decisions?status=approved`);
        if (!cancelled) {
          if (res.ok) {
            const data = (await res.json()) as { decisions?: TimelineDecision[]; cards?: TimelineDecision[] };
            const items = (data.decisions ?? data.cards ?? []).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
            setDecisions(items);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [groupId, isLoaded]);

  const types = ["all", ...Array.from(new Set(decisions.map((d) => d.decisionType)))];

  const filtered = decisions.filter((d) => {
    const matchType   = filterType === "all" || d.decisionType === filterType;
    const matchSearch =
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Search ── */}
      <View style={[styles.searchRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchInner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search decisions…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.clearBtn, { color: colors.mutedForeground }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter chips ── */}
      {types.length > 1 && (
        <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {types.map((t) => {
              const meta   = TYPE_META[t];
              const active = filterType === t;
              const accentColor = meta?.color ?? colors.primary;
              return (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.75}
                  style={[
                    styles.chip,
                    active
                      ? { backgroundColor: accentColor + "22", borderColor: accentColor }
                      : { backgroundColor: "transparent", borderColor: colors.border },
                  ]}
                  onPress={() => setFilterType(t)}
                >
                  {meta && <Text style={styles.chipEmoji}>{meta.icon}</Text>}
                  <Text style={[
                    styles.chipLabel,
                    { color: active ? accentColor : colors.mutedForeground, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" },
                  ]}>
                    {meta ? meta.label : "All"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Decision cards ── */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {search || filterType !== "all" ? "No matches" : "No decisions yet"}
          </Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            {search || filterType !== "all"
              ? "Try a different filter or search term."
              : "Approved decisions will appear here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item: d }) => {
            const meta = TYPE_META[d.decisionType] ?? TYPE_META.custom!;
            return (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                {/* Left accent */}
                <View style={[styles.accent, { backgroundColor: meta.color }]} />

                <View style={styles.cardBody}>
                  {/* Top row: title + type pill */}
                  <View style={styles.cardTop}>
                    <Text
                      style={[styles.cardTitle, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {d.title}
                    </Text>
                    <View style={[styles.typePill, { backgroundColor: meta.color + "18" }]}>
                      <Text style={styles.typeEmoji}>{meta.icon}</Text>
                      <Text style={[styles.typeLabel, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  {!!d.description && (
                    <Text
                      style={[styles.cardDesc, { color: colors.mutedForeground }]}
                      numberOfLines={2}
                    >
                      {d.description}
                    </Text>
                  )}

                  {/* Footer: date */}
                  <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
                    {formatDate(d.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: "center", justifyContent: "center" },

  // Search
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon:  { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", padding: 0 },
  clearBtn:    { fontSize: 12, lineHeight: 18 },

  // Filter bar
  filterBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  filterContent: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  chipEmoji: { fontSize: 13, lineHeight: 18 },
  chipLabel: { fontSize: 13, lineHeight: 18 },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  separator: { height: 10 },

  // Card
  card: {
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  accent: { width: 4 },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 21,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    flexShrink: 0,
  },
  typeEmoji: { fontSize: 11, lineHeight: 16 },
  typeLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", lineHeight: 16 },
  cardDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  cardDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // Empty
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyIcon:  { fontSize: 44 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  emptyBody:  { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
