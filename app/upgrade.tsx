import { Icon } from "@/components/Icon";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/hooks/useSubscription";

const STATIC_FREE_FEATURES = [
  "10 AI actions/day",
  "Basic summaries",
  "Basic memory",
];

const STATIC_PREMIUM_FEATURES = [
  "30 AI actions/day",
  "Advanced memory",
  "Personalized summaries",
  "Advanced planning tools",
];

type IconName = string;

function getFeatureIcon(feature: string): IconName {
  if (feature.includes("AI")) return "sparkles-outline";
  if (feature.includes("memor")) return "library-outline";
  if (feature.includes("summar")) return "document-text-outline";
  if (feature.includes("plan")) return "calendar-outline";
  if (feature.includes("poll")) return "stats-chart-outline";
  return "checkmark-circle-outline";
}

export default function UpgradeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const { status, plans, loading, createCheckout, refresh } = useSubscription(groupId ?? null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const premiumPlan = plans.find((p) => p.key === "premium");
  const monthlyPrice = premiumPlan?.stripePrices?.find((p) => p.interval === "month");

  const displayPrice = monthlyPrice
    ? `$${((monthlyPrice.unitAmount ?? 999) / 100).toFixed(2)}`
    : "$9.99";

  // Refresh when user returns from browser (after checkout)
  useEffect(() => {
    const sub = Linking.addEventListener("url", () => {
      setTimeout(() => refresh(), 1500);
    });
    return () => sub.remove();
  }, [refresh]);

  const handleUpgrade = async () => {
    if (!monthlyPrice?.priceId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCheckoutLoading(true);
    try {
      const url = await createCheckout(monthlyPrice.priceId);
      if (url) {
        await Linking.openURL(url);
        setTimeout(() => refresh(), 3000);
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isPremium = status?.isPremium ?? false;
  const used = status?.used ?? 0;
  const limit = status?.limit ?? 10;
  const usagePercent = Math.min(1, limit > 0 ? used / limit : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="close" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Upgrade Group</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 24, paddingHorizontal: 20, paddingTop: 24, gap: 20 }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + "20" }]}>
            <Icon name="sparkles" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            {isPremium ? "Your group is Premium 🎉" : "Unlock Premium for your group"}
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            {isPremium
              ? "Your whole group enjoys advanced AI features."
              : "Upgrade once — everyone in the group benefits instantly."}
          </Text>
        </View>

        {/* Usage bar */}
        {!loading && (
          <View style={[styles.usageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.usageRow}>
              <Text style={[styles.usageLabel, { color: colors.foreground }]}>
                Today's AI actions
              </Text>
              <Text style={[styles.usageCount, {
                color: used >= limit ? "#ff6b6b" : colors.primary,
              }]}>
                {used} / {limit}
              </Text>
            </View>
            <View style={[styles.usageTrack, { backgroundColor: colors.border }]}>
              <View style={[
                styles.usageFill,
                {
                  width: `${usagePercent * 100}%` as any,
                  backgroundColor: used >= limit ? "#ff6b6b" : colors.primary,
                },
              ]} />
            </View>
            {used >= limit && !isPremium && (
              <Text style={[styles.limitMsg, { color: "#ff6b6b" }]}>
                Daily limit reached — upgrade for 3× more AI actions
              </Text>
            )}
          </View>
        )}

        {/* Plan cards */}
        <View style={styles.plansRow}>
          {/* Free */}
          <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
            <Text style={[styles.planName, { color: colors.mutedForeground }]}>Free</Text>
            <Text style={[styles.planPrice, { color: colors.foreground }]}>$0</Text>
            <Text style={[styles.planPeriod, { color: colors.mutedForeground }]}>forever</Text>
            <View style={styles.features}>
              {STATIC_FREE_FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Icon name={getFeatureIcon(f)} size={13} color={colors.mutedForeground} />
                  <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Premium */}
          <View style={[
            styles.planCard,
            { backgroundColor: colors.primary + "14", borderColor: colors.primary, flex: 1 },
          ]}>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>BEST</Text>
            </View>
            <Text style={[styles.planName, { color: colors.primary }]}>Premium Group</Text>
            <Text style={[styles.planPrice, { color: colors.primary }]}>{displayPrice}</Text>
            <Text style={[styles.planPeriod, { color: colors.mutedForeground }]}>/month</Text>
            <View style={styles.features}>
              {STATIC_PREMIUM_FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Icon name={getFeatureIcon(f)} size={13} color={colors.primary} />
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Coming Soon banner */}
        {!isPremium && (
          <View style={[styles.comingSoonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary + "22" }]}>
              <Icon name="time-outline" size={16} color={colors.primary} />
              <Text style={[styles.comingSoonBadgeText, { color: colors.primary }]}>Coming Soon</Text>
            </View>
            <Text style={[styles.comingSoonTitle, { color: colors.foreground }]}>
              Paid plans are on the way
            </Text>
            <Text style={[styles.comingSoonBody, { color: colors.mutedForeground }]}>
              Everything is free while we're in early access. Paid plans will launch soon — we'll let you know.
            </Text>
          </View>
        )}

        {/* Active subscription */}
        {isPremium && status?.subscription && (
          <View style={[styles.activeCard, { backgroundColor: colors.accent + "18", borderColor: colors.accent }]}>
            <Icon name="checkmark-circle" size={22} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeTitle, { color: colors.foreground }]}>Premium active</Text>
              {status.subscription.periodEnd && (
                <Text style={[styles.activeSub, { color: colors.mutedForeground }]}>
                  {status.subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"}{" "}
                  {new Date(status.subscription.periodEnd).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        )}

        <Text style={[styles.fine, { color: colors.mutedForeground }]}>
          One subscription covers your whole group. Cancel anytime from the billing portal. Prices in USD.
        </Text>
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  hero: { alignItems: "center", gap: 12 },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center", letterSpacing: -0.3 },
  heroSub: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  usageCard: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
  },
  usageRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  usageLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  usageCount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  usageTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  usageFill: { height: 6, borderRadius: 3 },
  limitMsg: { fontSize: 13 },
  plansRow: { flexDirection: "row", gap: 12 },
  planCard: {
    borderRadius: 18,
    padding: 16,
    gap: 4,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 1 },
  planName: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  planPrice: { fontSize: 26, fontFamily: "Inter_700Bold" },
  planPeriod: { fontSize: 12, marginBottom: 8 },
  features: { gap: 8, marginTop: 2 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  featureText: { fontSize: 12, flex: 1 },
  ctaBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  activeTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  activeSub: { fontSize: 13, marginTop: 2 },
  fine: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  comingSoonCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 10,
    alignItems: "flex-start",
  },
  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  comingSoonBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  comingSoonTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  comingSoonBody: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
});
