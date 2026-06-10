import { Icon } from "@/components/Icon";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useColors } from "@/hooks/useColors";

interface Member {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

export default function MembersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { groups, leaveGroup, deleteGroup } = useApp();
  const { user } = useAuth();
  const authFetch = useAuthFetch();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const group = groups.find((g) => g.id === id);

  useEffect(() => {
    if (!id) return;
    setLoadingMembers(true);
    authFetch(`/groups/${id}/members`)
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as { members: Member[] };
          setMembers(data.members);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMembers(false));
  }, [id, authFetch]);

  if (!group) return null;

  const currentMember = members.find((m) => m.id === user?.id);
  const isOwner = currentMember?.role === "owner";

  const handleLeave = () => {
    const doLeave = () => {
      void leaveGroup(id ?? "");
      router.replace("/(tabs)");
    };
    if (Platform.OS === "web") { doLeave(); return; }
    Alert.alert("Leave Crew", `Leave "${group.name}"? You can rejoin with the invite code.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: doLeave },
    ]);
  };

  const handleDelete = () => {
    const doDelete = () => {
      void deleteGroup(id ?? "");
      router.replace("/(tabs)");
    };
    if (Platform.OS === "web") { doDelete(); return; }
    Alert.alert(
      "Delete Crew",
      `Permanently delete "${group.name}"? This cannot be undone and all messages will be lost.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.foreground }]}>{group.emoji ?? ""} {group.name}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {loadingMembers ? "Loading…" : `${members.length} member${members.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push(`/group/invite?id=${id}`)}>
          <Icon name="person-add-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loadingMembers ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={[styles.avatarText, { color: colors.foreground }]}>
                  {item.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.foreground }]}>
                  {item.name}
                  {item.id === user?.id ? " (you)" : ""}
                </Text>
                <Text
                  style={[
                    styles.role,
                    {
                      color:
                        item.role === "owner" || item.role === "admin"
                          ? colors.primary
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {item.role === "owner" ? "Owner" : item.role === "admin" ? "Admin" : "Member"}
                </Text>
              </View>
              <Text style={[styles.joinedAt, { color: colors.mutedForeground }]}>
                {new Date(item.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: botPad + (isOwner ? 140 : 100) }}
        />
      )}

      <View style={[styles.footer, { paddingBottom: botPad + 16, borderTopColor: colors.border }]}>
        {isOwner && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.destructive + "12", borderColor: colors.destructive + "40" }]}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Icon name="trash-outline" size={20} color={colors.destructive} />
            <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Delete Crew</Text>
          </TouchableOpacity>
        )}
        {!isOwner && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.destructive + "12", borderColor: colors.destructive + "40" }]}
            onPress={handleLeave}
            activeOpacity={0.8}
          >
            <Icon name="exit-outline" size={20} color={colors.destructive} />
            <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Leave Crew</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  info: { flex: 1 },
  name: { fontSize: 16, fontFamily: "Inter_500Medium" },
  role: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  joinedAt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  actionBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
