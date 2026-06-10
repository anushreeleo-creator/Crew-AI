import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { ClerkProvider, ClerkLoaded } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Appearance } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/contexts/AppContext";

SplashScreen.preventAutoHideAsync();

// Force dark mode on all platforms — the app is designed dark-first.
// On Android in Expo Go, userInterfaceStyle from app.json is not respected,
// so we enforce it programmatically here.
Appearance.setColorScheme("dark");

const queryClient = new QueryClient();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/welcome" options={{ animation: "fade" }} />
      <Stack.Screen name="auth/login" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="auth/otp" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="auth/setup" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="group/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="group/create" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="group/members" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="group/invite" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="group/memory" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="group/summaries" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="group/summary-settings" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="upgrade" options={{ animation: "slide_from_bottom" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} proxyUrl={proxyUrl}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <AppProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </AppProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
