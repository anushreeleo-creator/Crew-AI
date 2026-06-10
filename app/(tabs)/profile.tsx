import { Icon } from "@/components/Icon";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

type IconName = string;

function SettingsRow({ icon, label, value, onPress, danger }: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.settingsRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.settingsIcon, { backgroundColor: danger ? colors.destructive + "18" : colors.secondary }]}>
        <Icon name={icon} size={18} color={danger ? colors.destructive : colors.foreground} />
      </View>
      <Text style={[styles.settingsLabel, { color: danger ? colors.destructive : colors.foreground }]}>
        {label}
      </Text>
      {value ? (
        <Text style={[styles.settingsValue, { color: colors.mutedForeground }]}>{value}</Text>
      ) : null}
      {!danger && <Icon name="chevron-forward" size={16} color={colors.mutedForeground} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const { groups } = useApp();
  const [editModal, setEditModal] = useState(false);
  const [newName, setNewName] = useState(user?.name ?? "");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const initials = user?.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() ?? "?";

  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await logout();
        router.replace("/auth/welcome");
      } catch {
        Alert.alert("Error", "Could not sign out. Please try again.");
      }
    };

    if (Platform.OS === "web") {
      void doLogout();
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => void doLogout() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Close Account",
      "This will permanently delete your account and all your data — messages, crews, and everything else. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "Type your account's email below won't work here — just confirm one more time. Your data will be gone forever.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      await deleteAccount();
                      router.replace("/auth/welcome");
                    } catch (e: unknown) {
                      setDeleting(false);
                      Alert.alert("Error", e instanceof Error ? e.message : "Could not delete account. Please try again.");
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleSaveName = async () => {
    if (newName.trim().length >= 2) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateProfile({ name: newName.trim() });
      setEditModal(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <TouchableOpacity onPress={() => { setNewName(user?.name ?? ""); setEditModal(true); }}>
          <Icon name="pencil-outline" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 80 }}
      >
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
            <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>{user?.name}</Text>
          <Text style={[styles.identifier, { color: colors.mutedForeground }]}>{user?.identifier}</Text>

          <View style={styles.statsRow}>
            <View style={[styles.stat, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNum, { color: colors.foreground }]}>{groups.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Crews</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNum, { color: colors.foreground }]}>
                {groups.reduce((a, g) => a + g.memberCount, 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Members</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNum, { color: colors.accent }]}>AI</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Enabled</Text>
            </View>
          </View>
        </View>

        <View style={[styles.upgradeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.upgradeTitle, { color: colors.foreground }]}>Pro Plan — Coming Soon</Text>
            <Text style={[styles.upgradeSub, { color: colors.mutedForeground }]}>
              Everything is free while we're in early access
            </Text>
          </View>
          <View style={[styles.upgradeBadge, { backgroundColor: colors.muted }]}>
            <Icon name="time-outline" size={16} color={colors.mutedForeground} />
          </View>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACCOUNT</Text>
          <SettingsRow icon="person-outline" label="Edit Name" onPress={() => { setNewName(user?.name ?? ""); setEditModal(true); }} />
          <SettingsRow icon="notifications-outline" label="Notifications" value="On" />
          <SettingsRow icon="shield-outline" label="Privacy" />
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>AI</Text>
          <SettingsRow icon="sparkles-outline" label="AI Assistant" value="Active" />
          <SettingsRow icon="document-text-outline" label="Daily Recaps" value="Enabled" />
          <SettingsRow icon="refresh-outline" label="Weekly Summaries" value="On" />
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SUPPORT</Text>
          <SettingsRow icon="help-circle-outline" label="Help & FAQ" />
          <SettingsRow icon="mail-outline" label="Contact Us" />
          <SettingsRow icon="star-outline" label="Rate CrewAI" />
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>LEGAL</Text>
          <SettingsRow icon="document-text-outline" label="Privacy Policy" onPress={() => router.push("/legal/privacy-policy")} />
          <SettingsRow icon="shield-outline" label="Terms of Service" onPress={() => router.push("/legal/terms-of-service")} />
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <SettingsRow icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
          <SettingsRow icon="trash-outline" label="Close Account & Delete Data" onPress={handleDeleteAccount} danger />
        </View>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>CrewAI v1.0.0</Text>
      </ScrollView>

      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setEditModal(false)}>
          <TouchableOpacity
            style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: botPad + 16 }]}
            activeOpacity={1}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Edit Name</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: newName.trim().length >= 2 ? colors.primary : colors.muted }]}
              onPress={handleSaveName}
              disabled={newName.trim().length < 2}
            >
              <Text style={[styles.saveBtnText, { color: newName.trim().length >= 2 ? colors.primaryForeground : colors.mutedForeground }]}>
                Save
              </Text>
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
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  profileSection: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 24, gap: 8 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 4,
  },
  initials: { fontSize: 32, fontFamily: "Inter_700Bold" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  identifier: { fontSize: 14, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 4,
  },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  upgradeCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  upgradeTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 2 },
  upgradeSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  upgradeBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { marginTop: 16, marginHorizontal: 16, borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLabel: { fontSize: 15, fontFamily: "Inter_400Regular", flex: 1 },
  settingsValue: { fontSize: 14, fontFamily: "Inter_400Regular", marginRight: 4 },
  version: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 24, marginBottom: 8 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  inputWrap: { height: 52, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, justifyContent: "center" },
  input: { fontSize: 16, fontFamily: "Inter_400Regular" },
  saveBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
