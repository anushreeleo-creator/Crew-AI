import { Icon } from "@/components/Icon";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

function getInviteLink(inviteCode: string): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/web/join?code=${inviteCode}`;
  return `crewai://join?code=${inviteCode}`;
}

function getInviteMessage(groupName: string, emoji: string, inviteCode: string): string {
  const link = getInviteLink(inviteCode);
  return `Join "${emoji} ${groupName}" on CrewAI!\n\nTap to join: ${link}\n\nOr enter code: ${inviteCode}`;
}

export default function InviteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { groups } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const group = groups.find((g) => g.id === id);
  if (!group) return null;

  const inviteLink = getInviteLink(group.inviteCode);
  const inviteMsg = getInviteMessage(group.name, group.emoji || "🎉", group.inviteCode);

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(inviteLink);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(group.inviteCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: inviteMsg, title: `Join ${group.name}` });
    } catch (_) {}
  };

  const handleWhatsApp = async () => {
    const encoded = encodeURIComponent(inviteMsg);
    const url = `https://wa.me/?text=${encoded}`;
    try {
      await Linking.openURL(url);
    } catch (_) {}
  };

  const handleSMS = async () => {
    const encoded = encodeURIComponent(inviteMsg);
    const url = Platform.OS === "ios" ? `sms:?&body=${encoded}` : `sms:?body=${encoded}`;
    try {
      await Linking.openURL(url);
    } catch (_) {}
  };

  const handleOpenCrew = () => {
    router.replace(`/group/${group.id}`);
  };

  const codeChars = group.inviteCode.split("");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Icon name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Invite Friends</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.body, { paddingBottom: botPad + 20 }]}>
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.groupAvatarRing, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
            <Text style={styles.groupEmoji}>{group.emoji || "🎉"}</Text>
          </View>
          <Text style={[styles.groupName, { color: colors.foreground }]}>{group.name}</Text>
          <View style={[styles.memberBadge, { backgroundColor: colors.secondary }]}>
            <Icon name="people" size={13} color={colors.mutedForeground} />
            <Text style={[styles.memberCount, { color: colors.mutedForeground }]}>
              {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>INVITE CODE</Text>

        <TouchableOpacity
          style={styles.codeRow}
          onPress={handleCopyCode}
          activeOpacity={0.75}
        >
          {codeChars.map((c, i) => (
            <View key={i} style={[styles.codeTile, { backgroundColor: colors.card, borderColor: copiedCode ? colors.accent : colors.border }]}>
              <Text style={[styles.codeLetter, { color: copiedCode ? colors.accent : colors.primary }]}>{c}</Text>
            </View>
          ))}
          <View style={[styles.codeCopyIcon, { backgroundColor: colors.secondary }]}>
            <Icon
              name={copiedCode ? "checkmark" : "copy-outline"}
              size={18}
              color={copiedCode ? colors.accent : colors.mutedForeground}
            />
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SHARE VIA</Text>

        <View style={styles.shareGrid}>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: copiedLink ? colors.accent + "20" : colors.card, borderColor: copiedLink ? colors.accent : colors.border }]}
            onPress={handleCopyLink}
            activeOpacity={0.75}
          >
            <Icon name={copiedLink ? "checkmark-circle" : "link"} size={22} color={copiedLink ? colors.accent : colors.primary} />
            <Text style={[styles.shareBtnLabel, { color: copiedLink ? colors.accent : colors.foreground }]}>
              {copiedLink ? "Copied!" : "Copy Link"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleShare}
            activeOpacity={0.75}
          >
            <Icon name="share-social-outline" size={22} color={colors.primary} />
            <Text style={[styles.shareBtnLabel, { color: colors.foreground }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleWhatsApp}
            activeOpacity={0.75}
          >
            <Text style={styles.shareBtnIcon}>💬</Text>
            <Text style={[styles.shareBtnLabel, { color: colors.foreground }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleSMS}
            activeOpacity={0.75}
          >
            <Icon name="chatbubble-outline" size={22} color={colors.primary} />
            <Text style={[styles.shareBtnLabel, { color: colors.foreground }]}>SMS</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.openBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenCrew}
          activeOpacity={0.85}
        >
          <Text style={[styles.openBtnText, { color: colors.primaryForeground }]}>Open Crew</Text>
          <Icon name="arrow-forward" size={18} color={colors.primaryForeground} />
        </TouchableOpacity>

        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          Share only with people you trust — anyone with this code can join.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 14,
  },
  groupCard: {
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  groupAvatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 2,
  },
  groupEmoji: { fontSize: 36 },
  groupName: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  memberCount: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginTop: 2,
  },
  codeRow: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },
  codeTile: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  codeLetter: { fontSize: 22, fontFamily: "Inter_700Bold" },
  codeCopyIcon: {
    width: 40,
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  shareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  shareBtn: {
    width: "47.5%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  shareBtnIcon: { fontSize: 22 },
  shareBtnLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  openBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  openBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  note: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
});
