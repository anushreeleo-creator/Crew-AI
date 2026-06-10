import { Icon } from "@/components/Icon";
import { router } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const LAST_UPDATED = "June 9, 2026";
const CONTACT_EMAIL = "anushree.leo@gmail.com";

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <Text style={[styles.para, { color: colors.mutedForeground }]}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
      <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{children}</Text>
    </View>
  );
}

function Link({ href, label }: { href: string; label: string }) {
  const colors = useColors();
  return (
    <Text
      style={[styles.link, { color: colors.primary }]}
      onPress={() => Linking.openURL(href)}
    >
      {label}
    </Text>
  );
}

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace("/auth/welcome")}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <Icon name="close" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy Policy</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 40 }]}
      >
        <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>
          Last updated: {LAST_UPDATED}
        </Text>

        <Para>
          CrewAI is operated by <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>Anushree Vishwanath</Text>. This Privacy Policy explains how I collect, use, and share information about you when you use CrewAI.
        </Para>

        <SectionBlock title="What I Collect">
          <Para>I collect information you provide directly:</Para>
          <Bullet><Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>Account information</Text> — your email address, display name, and avatar emoji when you sign up.</Bullet>
          <Bullet><Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>Content you create</Text> — messages, polls, decisions, and other content you post within groups.</Bullet>
          <Bullet><Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>Usage data</Text> — how you interact with features such as AI requests, polls, and groups.</Bullet>
          <Para>I do not collect your precise location, payment card numbers, government IDs, or sensitive personal data.</Para>
        </SectionBlock>

        <SectionBlock title="Third-Party Services">
          <Para>CrewAI relies on the following third-party services that may process your data:</Para>
          <Bullet>
            <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>Replit</Text> — hosts the app and database.{" "}
            <Link href="https://replit.com/site/privacy" label="Replit Privacy Policy" />
          </Bullet>
          <Bullet>
            <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>Clerk</Text> — handles authentication and your login credentials.{" "}
            <Link href="https://clerk.com/legal/privacy" label="Clerk Privacy Policy" />
          </Bullet>
          <Bullet>
            <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>OpenAI</Text> — powers AI features. Messages sent to the AI may be processed by OpenAI.{" "}
            <Link href="https://openai.com/policies/privacy-policy" label="OpenAI Privacy Policy" />
          </Bullet>
          <Bullet>
            <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>Stripe</Text> — processes payments. I never see your full card details.{" "}
            <Link href="https://stripe.com/privacy" label="Stripe Privacy Policy" />
          </Bullet>
        </SectionBlock>

        <SectionBlock title="How I Use Your Data">
          <Bullet>Provide and improve the CrewAI service</Bullet>
          <Bullet>Authenticate you and keep your account secure</Bullet>
          <Bullet>Power AI features within your groups</Bullet>
          <Bullet>Process payments for premium features</Bullet>
          <Para>I do not sell your personal data to third parties.</Para>
        </SectionBlock>

        <SectionBlock title="Data Retention">
          <Para>
            Your data is stored as long as your account is active. To request deletion, email{" "}
            <Text
              style={[styles.link, { color: colors.primary }]}
              onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            >
              {CONTACT_EMAIL}
            </Text>. I will process requests within 30 days.
          </Para>
        </SectionBlock>

        <SectionBlock title="Your Rights">
          <Para>Depending on where you live, you may have the right to access, correct, or request deletion of your personal data. Email me to exercise these rights.</Para>
        </SectionBlock>

        <SectionBlock title="Children">
          <Para>CrewAI is not directed at children under 13. I do not knowingly collect data from children under 13.</Para>
        </SectionBlock>

        <SectionBlock title="Contact">
          <Para>
            Questions? Email{" "}
            <Text
              style={[styles.link, { color: colors.primary }]}
              onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            >
              {CONTACT_EMAIL}
            </Text>
          </Para>
        </SectionBlock>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            © {new Date().getFullYear()} Anushree Vishwanath
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: { width: 36, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 0 },
  lastUpdated: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 16 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 10 },
  para: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, marginBottom: 6 },
  bulletRow: { flexDirection: "row", gap: 8, marginBottom: 6, paddingRight: 8 },
  bulletDot: { fontSize: 14, lineHeight: 21, fontFamily: "Inter_600SemiBold" },
  bulletText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, flex: 1 },
  link: { fontFamily: "Inter_500Medium", textDecorationLine: "underline" },
  footer: { marginTop: 40, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth, alignItems: "center" },
  footerText: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
