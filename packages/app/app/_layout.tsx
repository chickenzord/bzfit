import "../global.css";
import { Stack, router, useRootNavigationState, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Feather } from "@expo/vector-icons";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../lib/auth";
import { ThemeProvider } from "../lib/theme";
import { queryClient } from "../lib/query-client";

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return; // navigator not mounted yet
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabs = segments[0] === "(tabs)";

    // Mid-session protection: if token expires or user logs out while in tabs
    if (!isAuthenticated && inTabs) {
      router.replace("/(auth)/login");
    }
    // Skip auth screens if already authenticated
    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments, navigationState?.key]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="index" />
        <Stack.Screen
          name="privacy"
          options={{
            headerShown: true,
            title: "Privacy Policy",
            headerStyle: { backgroundColor: "#0f172a" },
            headerTintColor: "#f8fafc",
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(Feather.font);
  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
