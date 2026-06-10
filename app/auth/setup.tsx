import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@clerk/expo";

const EMOJIS = ["🦊", "🐺", "🦁", "🐯", "🐻", "🐼", "🐨", "🦄", "🐉", "🦋", "🌊", "⚡", "🔥", "🌟", "🚀"];

export default function ProfileSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [displayName, setDisplayName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🦊");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const isValid = displayName.trim().length >= 2;

  const handleContinue = async () => {
    if (!isValid || !user) return;
    setLoading(true);
    setError("");
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          displayName: displayName.trim(),
          avatarEmoji: selectedEmoji,
        },
      });
      router.replace("/(tabs)");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 16 }]}>
      <View style={styles.body}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
          <Text style={styles.avatarEmoji}>{selectedEmoji}</Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          What's your name?
        </Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>
          This is how your crew members will see you.
        </Text>

        <View
          style={[
            styles.inputWrap,
            { backgroundColor: colors.input, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Your name"
            placeholderTextColor={colors.mutedForeground}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </View>

        {!!error && (
          <Text style={[styles.errorText, { color: "#ef4444" }]}>{error}</Text>
        )}

        <Text style={[styles.emojiLabel, { color: colors.mutedForeground }]}>Pick an avatar</Text>
        <View style={styles.emojiGrid}>
          {EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiBtn,
                { backgroundColor: selectedEmoji === emoji ? colors.primary + "30" : colors.secondary },
                selectedEmoji === emoji && { borderWidth: 2, borderColor: colors.primary },
              ]}
              onPress={() => setSelectedEmoji(emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiItem}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.btn,
            { backgroundColor: isValid ? colors.primary : colors.muted },
          ]}
          onPress={handleContinue}
          disabled={loading || !isValid}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.btnText, { color: isValid ? colors.primaryForeground : colors.mutedForeground }]}>
              Let's go
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  body: {
    flex: 1,
    paddingTop: 40,
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 4,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  inputWrap: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    justifyContent: "center",
    marginTop: 8,
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  emojiLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    width: "100%",
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiItem: {
    fontSize: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  desc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  btn: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  btnText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
});
