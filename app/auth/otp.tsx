import { useSignIn, useSignUp } from "@clerk/expo";
import { Icon } from "@/components/Icon";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const CODE_LENGTH = 6;

export default function OTPScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { type, email } = useLocalSearchParams<{ type: "signin" | "signup"; email: string }>();
  const isNewUser = type === "signup";

  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const updated = [...code];
    updated[idx] = val.slice(-1);
    setCode(updated);
    setError("");
    if (val && idx < CODE_LENGTH - 1) {
      inputs.current[idx + 1]?.focus();
    }
    if (updated.every((c) => c !== "") && idx === CODE_LENGTH - 1) {
      handleVerify(updated.join(""));
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    idx: number,
  ) => {
    if (e.nativeEvent.key === "Backspace" && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleResend = async () => {
    setResendTimer(30);
    try {
      if (isNewUser) {
        await signUp.verifications.sendEmailCode();
      } else {
        await signIn.emailCode.sendCode({ emailAddress: email });
      }
    } catch {}
  };

  const handleVerify = async (fullCode?: string) => {
    const c = fullCode ?? code.join("");
    if (c.length < CODE_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      type ClerkApiError = { errors?: Array<{ code: string; message: string }>; message?: string };
      if (isNewUser) {
        const verifyResult = await signUp.verifications.verifyEmailCode({ code: c });
        if (verifyResult.error) {
          const err = verifyResult.error as unknown as ClerkApiError | undefined;
          const msg = err?.errors?.[0]?.message ?? err?.message ?? "Invalid code. Please try again.";
          setError(msg);
          setCode(Array(CODE_LENGTH).fill(""));
          inputs.current[0]?.focus();
          return;
        }
        if (signUp.status === "complete") {
          await signUp.finalize();
          router.replace("/auth/setup");
        } else {
          setError("Verification incomplete. Please try again.");
          setCode(Array(CODE_LENGTH).fill(""));
          inputs.current[0]?.focus();
        }
      } else {
        const verifyResult = await signIn.emailCode.verifyCode({ code: c });
        if (verifyResult.error) {
          const err = verifyResult.error as unknown as ClerkApiError | undefined;
          const msg = err?.errors?.[0]?.message ?? err?.message ?? "Invalid code. Please try again.";
          setError(msg);
          setCode(Array(CODE_LENGTH).fill(""));
          inputs.current[0]?.focus();
          return;
        }
        if (signIn.status === "complete") {
          await signIn.finalize();
          router.replace("/");
        } else {
          setError("Verification incomplete. Please try again.");
          setCode(Array(CODE_LENGTH).fill(""));
          inputs.current[0]?.focus();
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid code. Please try again.";
      setError(msg);
      setCode(Array(CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const filled = code.filter(Boolean).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 16 }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Icon name="arrow-back" size={24} color={colors.foreground} />
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]}>Check your inbox</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>
          We sent a 6-digit code to{" "}
          <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium" }}>
            {email ?? "your email"}
          </Text>
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[
                styles.digit,
                {
                  backgroundColor: colors.input,
                  borderColor: digit ? colors.primary : colors.border,
                  color: colors.foreground,
                },
              ]}
              value={digit}
              onChangeText={(v) => handleChange(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              autoFocus={i === 0}
            />
          ))}
        </View>

        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.btn,
            { backgroundColor: filled === CODE_LENGTH ? colors.primary : colors.muted },
          ]}
          onPress={() => handleVerify()}
          disabled={loading || filled < CODE_LENGTH}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.btnText, { color: filled === CODE_LENGTH ? colors.primaryForeground : colors.mutedForeground }]}>
              Verify
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          disabled={resendTimer > 0}
          onPress={handleResend}
          activeOpacity={0.7}
        >
          <Text style={[styles.resend, { color: resendTimer > 0 ? colors.mutedForeground : colors.primary }]}>
            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
          </Text>
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
  back: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingTop: 32,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  hint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  codeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    justifyContent: "space-between",
  },
  digit: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  error: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  btn: {
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
  resend: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
