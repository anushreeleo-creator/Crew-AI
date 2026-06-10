import { useAuth, useUser } from "@clerk/expo";
import { useColors } from "@/hooks/useColors";
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const colors = useColors();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      const hasProfile = !!(user?.unsafeMetadata?.displayName || user?.firstName);
      if (hasProfile) {
        router.replace("/(tabs)");
      } else {
        router.replace("/auth/setup");
      }
    } else {
      router.replace("/auth/welcome");
    }
  }, [isSignedIn, isLoaded, user]);

  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}
