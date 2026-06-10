import { Icon } from "@/components/Icon";
import { useAuth } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function AnimatedNode({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  const opacity = useRef(new Animated.Value(0.2)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const colors = useColors();

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.3, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.2, duration: 1200, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primary,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      router.replace("/(tabs)");
    }
  }, [isSignedIn, isLoaded]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, delay: 200, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 800, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <LinearGradient
      colors={[colors.background, colors.background, colors.muted]}
      style={[styles.outer, { paddingTop: topPad, paddingBottom: botPad }]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated nodes */}
        <Animated.View style={{ opacity: fadeIn }}>
          <View style={styles.nodeField}>
            <AnimatedNode delay={0} x={40} y={60} size={10} />
            <AnimatedNode delay={400} x={120} y={30} size={7} />
            <AnimatedNode delay={800} x={200} y={80} size={12} />
            <AnimatedNode delay={200} x={280} y={20} size={8} />
            <AnimatedNode delay={600} x={320} y={90} size={6} />
            <View style={[styles.line, { backgroundColor: colors.primary + "30", left: 44, top: 65, width: 82 }]} />
            <View style={[styles.line, { backgroundColor: colors.primary + "30", left: 124, top: 35, width: 82, transform: [{ rotate: "20deg" }] }]} />
            <View style={[styles.line, { backgroundColor: colors.primary + "30", left: 206, top: 85, width: 78, transform: [{ rotate: "-15deg" }] }]} />
            <View style={[styles.line, { backgroundColor: colors.primary + "30", left: 284, top: 25, width: 44, transform: [{ rotate: "30deg" }] }]} />
          </View>
        </Animated.View>

        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" }]}>
            <Icon name="chatbubbles" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Your group's{"\n"}shared brain.</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Remember conversations, create polls, summarize discussions, and turn group chats into decisions.
          </Text>
        </Animated.View>

        {/* Demo card */}
        <Animated.View style={{ opacity: fadeIn, width: "100%" }}>
          <View style={[styles.mockup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.mockupHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.mockupGroupName, { color: colors.mutedForeground }]}>Friday Night Crew 🎉</Text>
            </View>
            <View style={styles.mockupMessages}>
              {[
                { name: "Sarah", initial: "S", color: "#f472b6", bg: "rgba(244,114,182,0.12)", msg: "Where should we eat Friday?" },
                { name: "Alex",  initial: "A", color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  msg: "Thai Palace?" },
                { name: "Tom",   initial: "T", color: "#fb923c", bg: "rgba(251,146,60,0.12)",  msg: "Maybe sushi." },
                { name: "Sarah", initial: "S", color: "#f472b6", bg: "rgba(244,114,182,0.12)", msg: "Budget under $30." },
                { name: "Alex",  initial: "A", color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  msg: "@ai can you help us pick?" },
              ].map(({ name, initial, color, bg, msg }, i) => (
                <View key={i} style={styles.msgRow}>
                  <View style={[styles.avatar, { backgroundColor: bg }]}>
                    <Text style={[styles.avatarText, { color }]}>{initial}</Text>
                  </View>
                  <View style={styles.msgContent}>
                    <Text style={[styles.msgName, { color }]}>{name}</Text>
                    <Text style={[styles.msgText, { color: colors.foreground }]}>
                      {msg.split(/(@ai)/i).map((part, j) =>
                        part.toLowerCase() === "@ai"
                          ? <Text key={j} style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>@ai</Text>
                          : part
                      )}
                    </Text>
                  </View>
                </View>
              ))}
              {/* AI bubble */}
              <View style={[styles.aiBubble, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
                <Text style={[styles.aiLabel, { color: colors.primary }]}>✨ CrewAI</Text>
                <Text style={[styles.aiText, { color: colors.foreground }]}>
                  Looks like you're planning dinner. I found a budget under $30 and two restaurant options. Want me to help the group decide?
                </Text>
                <View style={styles.aiActions}>
                  <View style={[styles.aiBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.aiBtnText}>🗳 Create Poll</Text>
                  </View>
                  <View style={[styles.aiBtn, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border }]}>
                    <Text style={[styles.aiBtnText, { color: colors.secondaryForeground }]}>📍 Find spots</Text>
                  </View>
                </View>
              </View>
              {/* Crew Memory badge */}
              <View style={[styles.memoryBadge, { backgroundColor: colors.primary + "0f", borderColor: colors.primary + "30" }]}>
                <Text style={styles.memoryIcon}>💾</Text>
                <View>
                  <Text style={[styles.memoryLabel, { color: colors.mutedForeground }]}>
                    <Text style={{ fontFamily: "Inter_600SemiBold" }}>Saved to Crew Memory  </Text>
                    Budget: under $30/person
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 3 Benefits */}
          <View style={styles.benefits}>
            {[
              { icon: "🧠", title: "Remembers your crew",  desc: "Preferences and past decisions, always in context." },
              { icon: "⚡", title: "Decides faster",        desc: "Polls, summaries, and picks in one message." },
              { icon: "📋", title: "Never miss a thing",    desc: "Ask for a recap anytime. AI catches you up." },
            ].map(({ icon, title, desc }) => (
              <View key={title} style={styles.benefitRow}>
                <View style={[styles.benefitIcon, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "25" }]}>
                  <Text style={{ fontSize: 16 }}>{icon}</Text>
                </View>
                <View style={styles.benefitText}>
                  <Text style={[styles.benefitTitle, { color: colors.foreground }]}>{title}</Text>
                  <Text style={[styles.benefitDesc, { color: colors.mutedForeground }]}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Auth actions */}
        <Animated.View style={[styles.actions, { opacity: fadeIn }]}>
          <Text style={[styles.ctaHeading, { color: colors.foreground }]}>
            Ready to get your crew organized?
          </Text>

          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth/login")}
            activeOpacity={0.85}
          >
            <Text style={styles.createBtnText}>Create your first crew  →</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/auth/login")} activeOpacity={0.7}>
            <Text style={[styles.signInLink, { color: colors.mutedForeground }]}>
              Already have an account?{" "}
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>
                Sign in
              </Text>
            </Text>
          </TouchableOpacity>

          <Text style={[styles.legalNote, { color: colors.mutedForeground }]}>
            By signing up, you agree to our{" "}
            <Text
              style={[styles.legalLink, { color: colors.mutedForeground }]}
              onPress={() => router.push("/legal/terms-of-service")}
            >
              Terms of Service
            </Text>
            {" "}and{" "}
            <Text
              style={[styles.legalLink, { color: colors.mutedForeground }]}
              onPress={() => router.push("/legal/privacy-policy")}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 20,
  },
  nodeField: {
    height: 110,
    position: "relative",
  },
  line: {
    position: "absolute",
    height: 1.5,
    borderRadius: 1,
  },
  hero: {
    alignItems: "center",
    gap: 12,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  title: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  benefits: {
    gap: 14,
    marginTop: 4,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  benefitText: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  benefitDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  actions: {
    gap: 16,
    alignItems: "center",
    paddingTop: 4,
  },
  ctaHeading: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  createBtn: {
    width: "100%",
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.2,
  },
  signInLink: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  legalNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 17,
    opacity: 0.6,
  },
  legalLink: {
    fontFamily: "Inter_500Medium",
    textDecorationLine: "underline",
  },
  mockup: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  mockupHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  mockupGroupName: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  mockupMessages: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  msgContent: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    flexShrink: 1,
  },
  msgName: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  msgText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
  },
  aiBubble: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 4,
    marginTop: 2,
  },
  aiLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  aiText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  aiActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  aiBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  aiBtnText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  memoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  memoryIcon: {
    fontSize: 11,
  },
  memoryLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
});
