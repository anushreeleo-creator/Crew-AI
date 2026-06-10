import { Icon } from "@/components/Icon";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const CREW_EMOJIS = [
  "🎉", "✈️", "🏠", "🍕", "🎮", "💼",
  "🏖️", "🎨", "🎵", "🏋️", "📚", "🌍",
  "🚀", "🌮", "🎯", "🏆", "🎸", "🍻",
  "🌴", "🔥", "⚡", "🧩", "🎭", "🎪",
];

export default function CreateGroupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { createGroup } = useApp();
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(CREW_EMOJIS[0]);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const isValid = name.trim().length >= 2;

  const handleCreate = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const group = await createGroup(name.trim(), selectedEmoji);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/group/invite?id=${group.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 16 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Icon name="close" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>New Crew</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.body, { paddingBottom: botPad + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.preview}>
          <View style={[styles.avatarRing, { borderColor: colors.primary + "40", backgroundColor: colors.primary + "15" }]}>
            <Text style={styles.avatarEmoji}>{selectedEmoji}</Text>
          </View>
          {name.trim().length > 0 && (
            <Text style={[styles.previewName, { color: colors.foreground }]} numberOfLines={1}>
              {name.trim()}
            </Text>
          )}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>CREW NAME</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: isValid ? colors.primary + "60" : colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Barcelona Trip, Apartment 4B…"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>PICK AN EMOJI</Text>
        <View style={styles.emojiGrid}>
          {CREW_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiBtn,
                { backgroundColor: selectedEmoji === emoji ? colors.primary + "20" : colors.secondary },
                selectedEmoji === emoji && { borderWidth: 2, borderColor: colors.primary },
              ]}
              onPress={() => {
                setSelectedEmoji(emoji);
                Haptics.selectionAsync();
              }}
              activeOpacity={0.65}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.createBtn,
            { backgroundColor: isValid ? colors.primary : colors.muted },
          ]}
          onPress={handleCreate}
          disabled={loading || !isValid}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Text style={styles.createBtnEmoji}>{selectedEmoji}</Text>
              <Text style={[styles.createBtnText, { color: isValid ? colors.primaryForeground : colors.mutedForeground }]}>
                Create Crew
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pageTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  body: { gap: 14 },
  preview: {
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
    marginTop: 4,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarEmoji: { fontSize: 48 },
  previewName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    maxWidth: 260,
    textAlign: "center",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginTop: 4,
  },
  inputWrap: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: "center",
  },
  input: {
    fontSize: 17,
    fontFamily: "Inter_400Regular",
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  emojiBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  emojiText: { fontSize: 26 },
  createBtn: {
    height: 58,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
  },
  createBtnEmoji: { fontSize: 22 },
  createBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
});
