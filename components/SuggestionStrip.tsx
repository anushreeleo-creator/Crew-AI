import { Icon } from "@/components/Icon";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export interface AISuggestion {
  id: string;
  type: "poll" | "trip" | "costs" | "summarize";
  label: string;
  subtitle: string;
  icon: string;
  action: string;
  color: string;
}

interface Props {
  suggestions: AISuggestion[];
  onAction: (action: string) => void;
  onDismiss: (id: string) => void;
}

function SuggestionCard({
  suggestion,
  onAction,
  onDismiss,
}: {
  suggestion: AISuggestion;
  onAction: (action: string) => void;
  onDismiss: (id: string) => void;
}) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: suggestion.color + "40",
        },
      ]}
      onPress={() => onAction(suggestion.action)}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: suggestion.color + "18" },
        ]}
      >
        <Icon
          name={suggestion.icon as string}
          size={16}
          color={suggestion.color}
        />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: colors.foreground }]} numberOfLines={1}>
          {suggestion.label}
        </Text>
        <Text
          style={[styles.subtitle, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {suggestion.subtitle}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => onDismiss(suggestion.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="close" size={13} color={colors.mutedForeground} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function SuggestionStrip({ suggestions, onAction, onDismiss }: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const prevLength = useRef(0);

  useEffect(() => {
    if (suggestions.length > 0 && prevLength.current === 0) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (suggestions.length === 0 && prevLength.current > 0) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevLength.current = suggestions.length;
  }, [suggestions.length, slideAnim, opacityAnim]);

  if (suggestions.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {suggestions.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            onAction={onAction}
            onDismiss={onDismiss}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 6,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 8,
    paddingBottom: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 220,
    minWidth: 150,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  closeBtn: {
    padding: 2,
    flexShrink: 0,
  },
});
