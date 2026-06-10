import React, { useCallback, useEffect, useState, useMemo } from "react";
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
import { Icon } from "@/components/Icon";
import * as Haptics from "expo-haptics";
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

function CreateModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    decisionType: string;
    status: string;
    priority: string;
  }) => Promise<void>;
}) {
  const colors = useColors();
  const [title, setTitle]         = useState("");
  const [description, setDesc]    = useState("");
  const [decisionType, setType]   = useState<DecisionType>("custom");
  const [status, setStatus]       = useState<DecisionStatus>("pending");
  const [priority, setPriority]   = useState<DecisionPriority>("medium");
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState("");

  async function handleSave() {
    if (!title.trim() || !description.trim()) { setErr("Title and description required"); return; }
    setSaving(true); setErr("");
    try {
      await onSave({ title: title.trim(), description: description.trim(), decisionType, status, priority });
      setTitle(""); setDesc(""); setType("custom"); setStatus("pending"); setPriority("medium");
      onClose();
    } catch { setErr("Failed to save decision"); }
    finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[cs.modal, { backgroundColor: colors.background }]}>
        <View style={[cs.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[cs.modalTitle, { color: colors.foreground }]}>New Decision Card</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <ScrollView style={cs.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={[cs.fieldLabel, { color: colors.mutedForeground }]}>Title *</Text>
          <TextInput
            style={[cs.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. Weekend restaurant choice"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
          <Text style={[cs.fieldLabel, { color: colors.mutedForeground }]}>Description *</Text>
          <TextInput
            style={[cs.input, cs.inputMulti, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Details about the decision…"
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDesc}
            multiline
            numberOfLines={2}
          />
          <Text style={[cs.fieldLabel, { color: colors.mutedForeground }]}>Type</Text>
          <View style={cs.chipRow}>
            {DECISION_TYPES.map((t) => {
              const m = TYPE_META[t];
              return (
                <TouchableOpacity
                  key={t}
                  style={[cs.chip, { borderColor: decisionType === t ? m.color : colors.border }, decisionType === t && { backgroundColor: m.color + "18" }]}
                  onPress={() => setType(t)}
                >
                  <Text style={[cs.chipText, { color: decisionType === t ? m.color : colors.mutedForeground }]}>{m.icon} {m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[cs.fieldLabel, { color: colors.mutedForeground }]}>Status</Text>
          <View style={cs.chipRow}>
            {DECISION_STATUSES.map((s) => {
              const m = STATUS_META[s];
              return (
                <TouchableOpacity
                  key={s}
                  style={[cs.chip, { borderColor: status === s ? m.color : colors.border }, status === s && { backgroundColor: m.color + "18" }]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[cs.chipText, { color: status === s ? m.color : colors.mutedForeground }]}>{m.icon} {m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[cs.fieldLabel, { color: colors.mutedForeground }]}>Priority</Text>
          <View style={cs.chipRow}>
            {DECISION_PRIORITIES.map((p) => {
              const m = PRIORITY_META[p];
              return (
                <TouchableOpacity
                  key={p}
                  style={[cs.chip, { borderColor: priority === p ? m.color : colors.border }, priority === p && { backgroundColor: m.color + "18" }]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[cs.chipText, { color: priority === p ? m.color : colors.mutedForeground }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!!err && <Text style={cs.errText}>{err}</Text>}
          <TouchableOpacity
            style={[cs.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={cs.saveBtnText}>Save Decision Card</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Finalize Modal ────────────────────────────────────────────────────────────

function FinalizeModal({
  card,
  visible,
  onClose,
  onResolve,
}: {
  card: DecisionCard | null;
  visible: boolean;
  onClose: () => void;
  onResolve: (details: { selectedOption?: string; date?: string; time?: string; participantCount?: number }) => Promise<void>;
}) {
  const colors  = useColors();
  const options = card ? ((card.metadataJson ?? {}) as { options?: string[] }).options ?? [] : [];
  const [selected,     setSelected]     = useState("");
  const [date,         setDate]         = useState("");
  const [time,         setTime]         = useState("");
  const [participants, setParticipants] = useState("");
  const [saving,       setSaving]       = useState(false);
  const [err,          setErr]          = useState("");

  useEffect(() => {
    if (visible) {
      setSelected(options[0] ?? "");
      setDate(""); setTime(""); setParticipants(""); setErr("");
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    setSaving(true); setErr("");
    try {
      await onResolve({
        selectedOption:   selected.trim() || undefined,
        date:             date.trim()     || undefined,
        time:             time.trim()     || undefined,
        participantCount: participants    ? Number(participants) : undefined,
      });
      onClose();
    } catch {
      setErr("Failed to finalize. Try again.");
      setSaving(false);
    }
  };

  const inputStyle = [fm.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }];
  const labelStyle = [fm.label, { color: colors.mutedForeground }];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[fm.container, { backgroundColor: colors.background }]}>
        <View style={[fm.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={fm.closeBtn}>
            <Text style={[fm.closeTxt, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[fm.title, { color: colors.foreground }]}>Finalize Decision</Text>
          <View style={{ width: 56 }} />
        </View>
        <ScrollView style={fm.scroll} contentContainerStyle={fm.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[fm.cardTitle, { color: colors.foreground }]}>{card?.title}</Text>
          {options.length > 0 ? (
            <View style={fm.field}>
              <Text style={labelStyle}>Winning option</Text>
              {options.map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[fm.optionBtn, { borderColor: selected === o ? colors.primary : colors.border }, selected === o && { backgroundColor: colors.primary + "15" }]}
                  onPress={() => setSelected(o === selected ? "" : o)}
                >
                  <View style={[fm.optionDot, { borderColor: selected === o ? colors.primary : colors.mutedForeground }, selected === o && { backgroundColor: colors.primary }]} />
                  <Text style={[fm.optionTxt, { color: selected === o ? colors.primary : colors.foreground }]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={fm.field}>
              <Text style={labelStyle}>Final choice</Text>
              <TextInput
                style={inputStyle}
                placeholder="e.g. Thai Palace, Budget $200…"
                placeholderTextColor={colors.mutedForeground}
                value={selected}
                onChangeText={setSelected}
                autoFocus
              />
            </View>
          )}
          <View style={fm.row}>
            <View style={[fm.field, { flex: 1 }]}>
              <Text style={labelStyle}>Date (optional)</Text>
              <TextInput style={inputStyle} placeholder="e.g. Friday" placeholderTextColor={colors.mutedForeground} value={date} onChangeText={setDate} />
            </View>
            <View style={[fm.field, { flex: 1 }]}>
              <Text style={labelStyle}>Time (optional)</Text>
              <TextInput style={inputStyle} placeholder="e.g. 7 PM" placeholderTextColor={colors.mutedForeground} value={time} onChangeText={setTime} />
            </View>
          </View>
          <View style={fm.field}>
            <Text style={labelStyle}>Participants (optional)</Text>
            <TextInput style={inputStyle} placeholder="e.g. 5" placeholderTextColor={colors.mutedForeground} value={participants} onChangeText={setParticipants} keyboardType="number-pad" />
          </View>
          {!!err && <Text style={fm.err}>{err}</Text>}
          <TouchableOpacity
            style={[fm.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}
            onPress={() => void handleSubmit()}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={fm.saveBtnText}>✅ Finalize Decision</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface Props {
  groupId: string;
  refreshKey?: number;
}

export function DecisionsDashboard({ groupId, refreshKey }: Props) {
  const colors    = useColors();
  const authFetch = useAuthFetch();

  const [cards,        setCards]        = useState<DecisionCard[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [query,        setQuery]        = useState("");
  const [showCreate,   setShowCreate]   = useState(false);
  const [finalizeCard, setFinalizeCard] = useState<DecisionCard | null>(null);

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true); setError(null);
    try {
      const res = await authFetch(`/groups/${groupId}/decisions`);
      if (!res.ok && res.status !== 304) throw new Error("Failed");
      if (res.status !== 304) {
        const data = (await res.json()) as { cards: DecisionCard[] };
        setCards(data.cards);
      }
    } catch { setError("Failed to load decisions"); }
    finally { setLoading(false); }
  }, [groupId, authFetch]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [groupId]);

  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) void load();
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(() => {
    let result = cards;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((c) =>
        c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [cards, query]);

  const handleStatusChange = useCallback(async (id: string, status: DecisionStatus) => {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    await authFetch(`/groups/${groupId}/decisions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }, [groupId, authFetch]);

  const handleDelete = useCallback(async (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    await authFetch(`/groups/${groupId}/decisions/${id}`, { method: "DELETE" });
  }, [groupId, authFetch]);

  const handleCreate = useCallback(async (data: {
    title: string; description: string; decisionType: string; status: string; priority: string;
  }) => {
    const res = await authFetch(`/groups/${groupId}/decisions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create");
    const body = (await res.json()) as { card: DecisionCard };
    setCards((prev) => [body.card, ...prev]);
  }, [groupId, authFetch]);

  const handleResolve = useCallback(async (
    details: { selectedOption?: string; date?: string; time?: string; participantCount?: number },
  ) => {
    if (!finalizeCard) return;
    const res = await authFetch(`/groups/${groupId}/decisions/${finalizeCard.id}/resolve`, {
      method: "POST",
      body: JSON.stringify(details),
    });
    if (!res.ok) throw new Error("Failed to resolve decision");
    const body = (await res.json()) as { card: DecisionCard };
    setCards((prev) => prev.map((c) => c.id === finalizeCard.id ? body.card : c));
    setFinalizeCard(null);
  }, [groupId, finalizeCard, authFetch]);

  return (
    <View style={[cs.container, { backgroundColor: colors.background }]}>

      {/* ── Toolbar ── */}
      <View style={[cs.toolbar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View style={[cs.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="search-outline" size={14} color={colors.mutedForeground} />
          <TextInput
            style={[cs.searchInput, { color: colors.foreground }]}
            placeholder="Search decisions…"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Icon name="close-circle" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[cs.newBtn, { backgroundColor: colors.primary }]}
          onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCreate(true); }}
        >
          <Icon name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      {loading && cards.length === 0 ? (
        <View style={cs.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={cs.centered}>
          <Text style={[cs.emptyTitle, { color: colors.foreground }]}>Failed to load</Text>
          <Text style={[cs.emptyText, { color: colors.mutedForeground }]}>{error}</Text>
          <TouchableOpacity onPress={() => void load()} style={[cs.retryBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.foreground, fontSize: 13 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : sorted.length === 0 ? (
        <View style={cs.centered}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🗳️</Text>
          <Text style={[cs.emptyTitle, { color: colors.foreground }]}>
            {query ? "No matches" : "No decisions yet"}
          </Text>
          <Text style={[cs.emptyText, { color: colors.mutedForeground }]}>
            {query
              ? "Try a different search"
              : "Decisions confirmed in chat appear here automatically."}
          </Text>
          {!query && (
            <TouchableOpacity
              style={[cs.createEmptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreate(true)}
            >
              <Text style={cs.createEmptyBtnText}>Add Decision Card</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={cs.list}
          contentContainerStyle={cs.listContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[cs.countLabel, { color: colors.mutedForeground }]}>
            {sorted.length} decision{sorted.length !== 1 ? "s" : ""}
          </Text>
          {sorted.map((card) => (
            <DecisionCardItem
              key={card.id}
              card={card}
              onDelete={(id) => void handleDelete(id)}
              onStatusChange={(id, s) => void handleStatusChange(id, s)}
              onFinalize={(c) => setFinalizeCard(c)}
            />
          ))}
        </ScrollView>
      )}

      <CreateModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreate}
      />
      <FinalizeModal
        card={finalizeCard}
        visible={!!finalizeCard}
        onClose={() => setFinalizeCard(null)}
        onResolve={handleResolve}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cs = StyleSheet.create({
  container:          { flex: 1 },
  toolbar:            { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  searchBox:          { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  searchInput:        { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", height: 18 },
  newBtn:             { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  centered:           { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle:         { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText:          { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  retryBtn:           { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  createEmptyBtn:     { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, marginTop: 8 },
  createEmptyBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  list:               { flex: 1 },
  listContent:        { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 32, gap: 10 },
  countLabel:         { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  // Modal
  modal:       { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle:  { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  modalBody:   { flex: 1, padding: 16 },
  fieldLabel:  { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6, marginTop: 14 },
  input:       { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  inputMulti:  { height: 60, textAlignVertical: "top" },
  chipRow:     { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip:        { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  chipText:    { fontSize: 11, fontFamily: "Inter_500Medium" },
  errText:     { color: "#ef4444", fontSize: 12, textAlign: "center", marginTop: 6 },
  saveBtn:     { height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 24, marginBottom: 16 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

const fm = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  closeBtn:      { width: 56 },
  closeTxt:      { fontSize: 14 },
  title:         { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  scroll:        { flex: 1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 40 },
  cardTitle:     { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 4 },
  field:         { gap: 6 },
  row:           { flexDirection: "row", gap: 12 },
  label:         { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6 },
  input:         { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  optionBtn:     { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  optionDot:     { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  optionTxt:     { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  err:           { color: "#ef4444", fontSize: 12 },
  saveBtn:       { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  saveBtnText:   { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
