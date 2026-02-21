import "../global.css";
import { Stack, router, useRootNavigationState, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../lib/auth";
import { ThemeProvider } from "../lib/theme";

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return; // navigator not mounted yet
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inPublicRoute = segments[0] === "privacy";
    if (!isAuthenticated && !inAuthGroup && !inPublicRoute) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
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
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
