import { Icon } from "@/components/Icon";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import {
  DecisionCardItem,
  type DecisionCard,
  type DecisionStatus,
  type DecisionType,
  type DecisionPriority,
  STATUS_META,
  TYPE_META,
  PRIORITY_META,
  DECISION_TYPES,
  DECISION_STATUSES,
  DECISION_PRIORITIES,
} from "@/components/DecisionCard";


// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateDecisionModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave:  (data: { title: string; description: string; decisionType: string; status: string; priority: string; assignedTo?: string; dueDate?: string }) => Promise<void>;
}) {
  const colors = useColors();
  const [title,        setTitle]       = useState("");
  const [description,  setDescription] = useState("");
  const [decisionType, setType]        = useState<DecisionType>("custom");
  const [status,       setStatus]      = useState<DecisionStatus>("pending");
  const [priority,     setPriority]    = useState<DecisionPriority>("medium");
  const [assignedTo,   setAssignedTo]  = useState("");
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  async function handleSave() {
    if (!title.trim() || !description.trim()) { setErr("Title and description required"); return; }
    setSaving(true); setErr("");
    try {
      await onSave({ title: title.trim(), description: description.trim(), decisionType, status, priority, assignedTo: assignedTo.trim() || undefined });
      setTitle(""); setDescription(""); setType("custom"); setStatus("pending"); setPriority("medium"); setAssignedTo("");
      onClose();
    } catch { setErr("Failed to save decision"); }
    finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Decision Card</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Title *</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="e.g. Restaurant selected" placeholderTextColor={colors.mutedForeground} value={title} onChangeText={setTitle} />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Description *</Text>
          <TextInput style={[styles.input, styles.inputMultiline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="e.g. Thai Palace, Friday at 7pm" placeholderTextColor={colors.mutedForeground} value={description} onChangeText={setDescription} multiline numberOfLines={2} />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Type</Text>
          <View style={styles.optionRow}>
            {DECISION_TYPES.map((t) => {
              const m = TYPE_META[t];
              return (
                <TouchableOpacity key={t} style={[styles.optionChip, { borderColor: decisionType === t ? m.color : colors.border }, decisionType === t && { backgroundColor: m.color + "15" }]} onPress={() => setType(t)}>
                  <Text style={{ fontSize: 11 }}>{m.icon}</Text>
                  <Text style={[styles.optionChipText, { color: decisionType === t ? m.color : colors.mutedForeground }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Status</Text>
          <View style={styles.optionRow}>
            {DECISION_STATUSES.map((s) => {
              const m = STATUS_META[s];
              return (
                <TouchableOpacity key={s} style={[styles.optionChip, { borderColor: status === s ? m.color : colors.border }, status === s && { backgroundColor: m.color + "15" }]} onPress={() => setStatus(s)}>
                  <Text style={[styles.optionChipText, { color: status === s ? m.color : colors.mutedForeground }]}>{m.icon} {m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Priority</Text>
          <View style={styles.optionRow}>
            {DECISION_PRIORITIES.map((p) => {
              const m = PRIORITY_META[p];
              return (
                <TouchableOpacity key={p} style={[styles.optionChip, { borderColor: priority === p ? m.color : colors.border }, priority === p && { backgroundColor: m.color + "15" }]} onPress={() => setPriority(p)}>
                  <Text style={[styles.optionChipText, { color: priority === p ? m.color : colors.mutedForeground }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Assigned to (optional)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="Name or @handle" placeholderTextColor={colors.mutedForeground} value={assignedTo} onChangeText={setAssignedTo} />

          {!!err && <Text style={styles.errText}>{err}</Text>}

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]} onPress={() => void handleSave()} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Decision Card</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DecisionsScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const authFetch = useAuthFetch();
  const [cards,      setCards]      = useState<DecisionCard[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [query,      setQuery]      = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const load = useCallback(async (q?: string) => {
    if (!groupId) return;
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await authFetch(`/groups/${groupId}/decisions${qs}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { cards: DecisionCard[] };
      setCards(data.cards);
    } catch { setError("Failed to load decisions"); }
    finally { setLoading(false); }
  }, [groupId, authFetch]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [groupId]);

  useEffect(() => {
    const t = setTimeout(() => void load(query || undefined), 300);
    return () => clearTimeout(t);
  }, [query, load]);

  const handleDelete = useCallback(async (id: string) => {
    if (!groupId) return;
    setCards((prev) => prev.filter((c) => c.id !== id));
    await authFetch(`/groups/${groupId}/decisions/${id}`, { method: "DELETE" });
  }, [groupId, authFetch]);

  const handleStatusChange = useCallback(async (id: string, status: DecisionStatus) => {
    if (!groupId) return;
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    await authFetch(`/groups/${groupId}/decisions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }, [groupId, authFetch]);

  const handleCreate = useCallback(async (data: { title: string; description: string; decisionType: string; status: string; priority: string; assignedTo?: string }) => {
    if (!groupId) return;
    const res = await authFetch(`/groups/${groupId}/decisions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create");
    const body = (await res.json()) as { card: DecisionCard };
    setCards((prev) => [body.card, ...prev]);
  }, [groupId, authFetch]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Decision Cards</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search + Status filter */}
      <View style={[styles.searchRow, { borderBottomColor: colors.border }]}>
        <Icon name="search-outline" size={16} color={colors.mutedForeground} style={{ marginRight: 4 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground, flex: 1 }]}
          placeholder="Search…"
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Icon name="close-circle" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>


      {/* Content */}
      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{error}</Text>
          <TouchableOpacity onPress={() => void load()} style={[styles.retryBtn, { borderColor: colors.border }]}>
            <Text style={[{ color: colors.foreground, fontSize: 14 }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : cards.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🗳️</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {query ? "No matches" : "No decisions yet"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {query ? "Try a different search" : "Decisions confirmed in chat appear here automatically."}
          </Text>
          {!query && (
            <TouchableOpacity style={[styles.createEmptyBtn, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
              <Text style={styles.createEmptyBtnText}>Add Decision Card</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
            {cards.length} decision{cards.length !== 1 ? "s" : ""}
          </Text>
          {cards.map((card) => (
            <DecisionCardItem
              key={card.id}
              card={card}
              onDelete={(id) => void handleDelete(id)}
              onStatusChange={(id, s) => void handleStatusChange(id, s)}
            />
          ))}
        </ScrollView>
      )}

      <CreateDecisionModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreate}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  addBtn: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  searchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  searchInput: { fontSize: 14, fontFamily: "Inter_400Regular", height: 24 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  createEmptyBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, marginTop: 8 },
  createEmptyBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  countLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  modalBody: { flex: 1, padding: 16 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  inputMultiline: { height: 64, textAlignVertical: "top" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  optionChipText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  errText: { color: "#ef4444", fontSize: 12, textAlign: "center", marginTop: 8 },
  saveBtn: { height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 24, marginBottom: 16 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
