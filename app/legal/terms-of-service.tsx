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

export default function TermsOfServiceScreen() {
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Terms of Service</Text>
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
          These Terms govern your use of <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>CrewAI</Text>, operated by <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>Anushree Vishwanath</Text>. By creating an account or using CrewAI, you agree to these terms.
        </Para>

        <SectionBlock title="The Service">
          <Para>CrewAI is an AI-powered private group space for decisions, polls, and planning. It is provided "as is" and may change or be discontinued at any time.</Para>
        </SectionBlock>

        <SectionBlock title="Your Account">
          <Para>You are responsible for:</Para>
          <Bullet>Providing accurate information when you sign up</Bullet>
          <Bullet>Keeping your account credentials secure</Bullet>
          <Bullet>All activity that occurs under your account</Bullet>
          <Para>You must be at least 13 years old to use CrewAI.</Para>
        </SectionBlock>

        <SectionBlock title="Acceptable Use">
          <Para>You agree not to use CrewAI to:</Para>
          <Bullet>Post content that is illegal, harmful, harassing, or abusive</Bullet>
          <Bullet>Attempt to access other users' accounts or private data</Bullet>
          <Bullet>Use the AI assistant for harmful, deceptive, or illegal purposes</Bullet>
          <Bullet>Spam, phish, or otherwise abuse the platform</Bullet>
          <Para>I reserve the right to suspend or terminate accounts that violate these rules.</Para>
        </SectionBlock>

        <SectionBlock title="Your Content">
          <Para>You own the content you create in CrewAI. By using CrewAI, you grant me a limited license to store and process your content solely to provide the service.</Para>
          <Para>You are responsible for the content you post. Do not share private information about others without their consent.</Para>
        </SectionBlock>

        <SectionBlock title="AI-Generated Content">
          <Para>AI output may be inaccurate, incomplete, or misleading.</Para>
          <Para>
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>
              Do not rely on AI output for medical, legal, financial, or other high-stakes decisions.
            </Text>
            {" "}Always verify important information independently.
          </Para>
        </SectionBlock>

        <SectionBlock title="Disclaimer & Limitation of Liability">
          <Para>CrewAI is provided "as is" without warranties of any kind. Service availability depends in part on Replit's platform. I am not responsible for outages, data loss, or issues from Replit, Clerk, OpenAI, or Stripe.</Para>
          <Para>To the fullest extent permitted by law, Anushree Vishwanath shall not be liable for any indirect, incidental, or consequential damages arising from your use of CrewAI.</Para>
        </SectionBlock>

        <SectionBlock title="Payments">
          <Para>
            Premium features are billed through Stripe. Payments are non-refundable except where required by law. Contact{" "}
            <Text
              style={[styles.link, { color: colors.primary }]}
              onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            >
              {CONTACT_EMAIL}
            </Text>
            {" "}for billing issues.
          </Para>
        </SectionBlock>

        <SectionBlock title="Termination">
          <Para>You may stop using CrewAI and request account deletion by emailing me. I may suspend your access without notice if you violate these terms.</Para>
        </SectionBlock>

        <SectionBlock title="Governing Law">
          <Para>These Terms are governed by the laws of the State of California, USA.</Para>
        </SectionBlock>

        <SectionBlock title="Contact">
          <Para>
            Questions?{" "}
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
