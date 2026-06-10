import { Icon } from "@/components/Icon";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  text: string;
  timestamp: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function renderLine(line: string, index: number, colors: ReturnType<typeof useColors>) {
  if (line.startsWith("**") && line.endsWith("**")) {
    return (
      <Text key={index} style={[styles.boldLine, { color: colors.foreground }]}>
        {line.replace(/\*\*/g, "")}
      </Text>
    );
  }
  if (line.startsWith("•")) {
    return (
      <Text key={index} style={[styles.bulletLine, { color: colors.foreground }]}>
        {line}
      </Text>
    );
  }
  if (line === "") return <View key={index} style={{ height: 6 }} />;
  return (
    <Text key={index} style={[styles.line, { color: colors.foreground }]}>
      {line.replace(/\*\*/g, "")}
    </Text>
  );
}

export function RecapCard({ text, timestamp }: Props) {
  const colors = useColors();
  const lines = text.split("\n");

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.accent + "33",
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accent + "20" }]}>
          <Icon name="sparkles" size={14} color={colors.accent} />
        </View>
        <Text style={[styles.label, { color: colors.accent }]}>AI Recap</Text>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {formatTime(timestamp)}
        </Text>
      </View>
      <View style={styles.body}>
        {lines.map((line, i) => renderLine(line, i, colors))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  time: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  body: {
    gap: 2,
  },
  boldLine: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  bulletLine: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  line: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
});
