import { useSignIn, useSignUp } from "@clerk/expo";
import { Icon } from "@/components/Icon";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleContinue = async () => {
    if (!isValid || loading) return;
    setError("");
    setLoading(true);
    const trimmedEmail = email.trim();
    try {
      const result = await signIn.emailCode.sendCode({ emailAddress: trimmedEmail });
      if (!result.error) {
        router.push({ pathname: "/auth/otp", params: { type: "signin", email: trimmedEmail } });
        return;
      }
      // Clerk nests the error code inside errors[0].code at runtime despite the ClerkError type
      type ClerkApiError = { errors?: Array<{ code: string; message: string }>; message?: string; code?: string };
      const signInErr = result.error as unknown as ClerkApiError | undefined;
      const errorCode = signInErr?.errors?.[0]?.code ?? signInErr?.code;
      if (
        errorCode === "form_identifier_not_found" ||
        errorCode === "form_identifier_not_eligible_for_strategy"
      ) {
        const createResult = await signUp.create({ emailAddress: trimmedEmail });
        if (!createResult.error) {
          await signUp.verifications.sendEmailCode();
          router.push({ pathname: "/auth/otp", params: { type: "signup", email: trimmedEmail } });
          return;
        }
        const createErr = createResult.error as unknown as ClerkApiError | undefined;
        setError(createErr?.errors?.[0]?.message ?? createErr?.message ?? "Failed to create account.");
      } else {
        setError(signInErr?.errors?.[0]?.message ?? signInErr?.message ?? "Something went wrong.");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 16 }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Icon name="arrow-back" size={24} color={colors.foreground} />
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" }]}>
          <Icon name="mail" size={32} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>What's your email?</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>
          We'll send a verification code to sign you in or create your account.
        </Text>

        <View
          style={[
            styles.inputWrap,
            { backgroundColor: colors.input, borderColor: error ? colors.destructive : colors.border },
          ]}
        >
          <Icon name="mail-outline" size={20} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="your@email.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={(v) => { setEmail(v); setError(""); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="go"
            onSubmitEditing={handleContinue}
          />
        </View>

        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: isValid ? colors.primary : colors.muted }]}
          onPress={handleContinue}
          disabled={loading || !isValid}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.btnText, { color: isValid ? colors.primaryForeground : colors.mutedForeground }]}>
              Continue
            </Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.terms, { color: colors.mutedForeground }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>

      <View nativeID="clerk-captcha" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  back: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingTop: 32,
    gap: 16,
    alignItems: "center",
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: 4,
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
    lineHeight: 22,
    textAlign: "center",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 8,
    width: "100%",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  error: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  btn: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    width: "100%",
  },
  btnText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  terms: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
