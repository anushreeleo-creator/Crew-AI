import { Icon } from "@/components/Icon";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GroupCard } from "@/components/GroupCard";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

// ─── HowItWorks Modal ─────────────────────────────────────────────────────────

const FLOW_STEPS = [
  { icon: "💬", label: "Chat" },
  { icon: "🗳️", label: "Decide" },
  { icon: "🧠", label: "Remember" },
];

const FEATURES = [
  {
    icon: "🗳️",
    title: "Decision Cards",
    desc: "AI detects pending decisions in chat and creates trackable cards — or you create them manually.",
    color: "#7c6bff",
  },
  {
    icon: "🤖",
    title: "AI Assistant",
    desc: "Ask your crew's AI anything. It knows your past decisions and recalls group preferences automatically.",
    color: "#00e5bb",
  },
  {
    icon: "📌",
    title: "Group Memory",
    desc: "Every resolved decision is saved. Next time you plan something, the AI remembers what you chose and why.",
    color: "#f59e0b",
  },
  {
    icon: "📋",
    title: "Summaries",
    desc: "Generate AI-written summaries of long conversations so no one misses what was decided.",
    color: "#ec4899",
  },
];

function HowItWorksModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[hw.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[hw.header, { borderBottomColor: colors.border }]}>
          <Text style={[hw.title, { color: colors.foreground }]}>How CrewAI Works</Text>
          <TouchableOpacity onPress={onClose} style={hw.closeBtn}>
            <Icon name="close" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={hw.scroll}
          contentContainerStyle={[hw.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Tagline */}
          <Text style={[hw.tagline, { color: colors.mutedForeground }]}>
            An AI-powered private space for your crew to chat, make decisions, and remember what matters.
          </Text>

          {/* Flow indicator */}
          <View style={[hw.flowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[hw.sectionLabel, { color: colors.mutedForeground }]}>THE FLOW</Text>
            <View style={hw.flowRow}>
              {FLOW_STEPS.map((step, i) => (
                <React.Fragment key={step.label}>
                  <View style={hw.flowStep}>
                    <View style={[hw.flowIconWrap, { backgroundColor: colors.secondary }]}>
                      <Text style={hw.flowIcon}>{step.icon}</Text>
                    </View>
                    <Text style={[hw.flowLabel, { color: colors.foreground }]}>{step.label}</Text>
                  </View>
                  {i < FLOW_STEPS.length - 1 && (
                    <Icon name="arrow-forward" size={16} color={colors.mutedForeground} style={hw.flowArrow} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Example decision card */}
          <View style={[hw.exampleCard, { backgroundColor: "#00e5bb0a", borderColor: "#00e5bb40" }]}>
            <Text style={[hw.sectionLabel, { color: colors.mutedForeground }]}>EXAMPLE</Text>
            <View style={hw.exampleHeader}>
              <Text style={{ fontSize: 16 }}>📌</Text>
              <Text style={[hw.exampleTitle, { color: "#00e5bb" }]}>Decision Saved to Memory</Text>
            </View>
            <View style={[hw.exampleDecision, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[hw.exampleDecisionTitle, { color: colors.foreground }]}>🍜 Friday Dinner</Text>
              <Text style={[hw.exampleDecisionMeta, { color: colors.mutedForeground }]}>Thai Palace · Budget $30 · 5 people</Text>
              <View style={[hw.exampleBadge, { backgroundColor: "#00e5bb20" }]}>
                <Text style={{ color: "#00e5bb", fontSize: 12, fontFamily: "Inter_600SemiBold" }}>✅ Approved</Text>
              </View>
            </View>
            <Text style={[hw.exampleCaption, { color: colors.mutedForeground }]}>
              Next time you ask "where should we eat?", the AI remembers you love Thai Palace.
            </Text>
          </View>

          {/* Features */}
          <Text style={[hw.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>KEY FEATURES</Text>
          {FEATURES.map((f) => (
            <View key={f.title} style={[hw.featureRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[hw.featureIconWrap, { backgroundColor: f.color + "18" }]}>
                <Text style={hw.featureIcon}>{f.icon}</Text>
              </View>
              <View style={hw.featureText}>
                <Text style={[hw.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
                <Text style={[hw.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const hw = StyleSheet.create({
  container:      { flex: 1 },
  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  title:          { fontSize: 18, fontFamily: "Inter_700Bold" },
  closeBtn:       { padding: 4 },
  scroll:         { flex: 1 },
  scrollContent:  { padding: 20, gap: 16 },
  tagline:        { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, textAlign: "center", paddingHorizontal: 8 },
  sectionLabel:   { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  flowCard:       { borderRadius: 16, borderWidth: 1, padding: 18 },
  flowRow:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  flowStep:       { alignItems: "center", gap: 6, flex: 1 },
  flowIconWrap:   { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  flowIcon:       { fontSize: 24 },
  flowLabel:      { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  flowArrow:      { marginBottom: 14 },
  exampleCard:    { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  exampleHeader:  { flexDirection: "row", alignItems: "center", gap: 8 },
  exampleTitle:   { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  exampleDecision:{ borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  exampleDecisionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  exampleDecisionMeta:  { fontSize: 13, fontFamily: "Inter_400Regular" },
  exampleBadge:   { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  exampleCaption: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic", lineHeight: 17 },
  featureRow:     { flexDirection: "row", gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "flex-start" },
  featureIconWrap:{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  featureIcon:    { fontSize: 22 },
  featureText:    { flex: 1, gap: 3 },
  featureTitle:   { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  featureDesc:    { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});

export default function GroupsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { groups, joinGroup, isLoading } = useApp();
  const [joinModal, setJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await logout();
        router.replace("/auth/welcome");
      } catch {
        // silently ignore — auth guard will redirect if session is invalid
      }
    };
    if (Platform.OS === "web") { void doLogout(); return; }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => void doLogout() },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinError("");
    try {
      const group = await joinGroup(joinCode.trim());
      if (!group) {
        setJoinError("Invalid invite code. Check and try again.");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setJoinModal(false);
        setJoinCode("");
        router.push(`/group/${group.id}`);
      }
    } finally {
      setJoinLoading(false);
    }
  };

  const totalUnread = groups.reduce((a, g) => a + g.unreadCount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Hey, {user?.name?.split(" ")[0] ?? "there"}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Your Crews
          </Text>
        </View>
        <View style={styles.headerActions}>
          {totalUnread > 0 && (
            <View style={[styles.unreadDot, { backgroundColor: colors.destructive }]} />
          )}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
            onPress={() => setShowInfo(true)}
          >
            <Icon name="information-circle-outline" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
            onPress={handleLogout}
          >
            <Icon name="log-out-outline" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/group/create")}
          >
            <Icon name="add" size={22} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : groups.length === 0 ? (
        <ScrollView contentContainerStyle={[styles.empty, { paddingBottom: botPad + 80 }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Icon name="people-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No crews yet
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Create a crew for your friend group, travel squad, or roommates — or join one with an invite code.
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/group/create")}
            activeOpacity={0.85}
          >
            <Icon name="add" size={20} color={colors.primaryForeground} />
            <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
              Create a Crew
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.emptyBtnGhost, { borderColor: colors.border }]}
            onPress={() => { setJoinModal(true); setJoinError(""); }}
            activeOpacity={0.7}
          >
            <Icon name="key-outline" size={20} color={colors.foreground} />
            <Text style={[styles.emptyBtnGhostText, { color: colors.foreground }]}>
              Join with Code
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/group/${item.id}`);
              }}
            />
          )}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: botPad + 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <HowItWorksModal visible={showInfo} onClose={() => setShowInfo(false)} />

      <Modal visible={joinModal} transparent animationType="slide" onRequestClose={() => setJoinModal(false)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setJoinModal(false)}>
          <TouchableOpacity
            style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: botPad + 16 }]}
            activeOpacity={1}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              Join a Crew
            </Text>
            <Text style={[styles.sheetDesc, { color: colors.mutedForeground }]}>
              Enter the 6-character invite code shared by your crew.
            </Text>
            <View style={[styles.codeInput, { backgroundColor: colors.input, borderColor: joinError ? colors.destructive : colors.border }]}>
              <TextInput
                style={[styles.codeText, { color: colors.foreground }]}
                placeholder="ABC123"
                placeholderTextColor={colors.mutedForeground}
                value={joinCode}
                onChangeText={(v) => { setJoinCode(v.toUpperCase()); setJoinError(""); }}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
                textAlign="center"
              />
            </View>
            {joinError ? (
              <Text style={[styles.joinError, { color: colors.destructive }]}>{joinError}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: joinCode.trim().length >= 4 ? colors.primary : colors.muted }]}
              onPress={handleJoin}
              disabled={joinLoading || joinCode.trim().length < 4}
              activeOpacity={0.85}
            >
              {joinLoading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.joinBtnText, { color: joinCode.trim().length >= 4 ? colors.primaryForeground : colors.mutedForeground }]}>
                  Join Crew
                </Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    top: 0,
    right: 0,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
    paddingTop: 60,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  emptyBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  emptyBtnGhost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  emptyBtnGhostText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  sheetDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  codeInput: {
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    justifyContent: "center",
    marginTop: 4,
  },
  codeText: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: 6,
  },
  joinError: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  joinBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  joinBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
