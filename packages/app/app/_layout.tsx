// Must be the first import — initialises the dev client launcher in debug builds
import "expo-dev-client";
import "../global.css";
import { crashReporter } from "../lib/crash-reporter";
import { Stack, router, useRootNavigationState, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../lib/auth";
import { ThemeProvider } from "../lib/theme";
import { queryClient } from "../lib/query-client";

// Keep native splash visible until we're ready
SplashScreen.preventAutoHideAsync();

// Initialise crash reporting as early as possible so uncaught JS errors
// that occur during app startup are captured.
crashReporter.log("App starting");

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return; // navigator not mounted yet
    if (isLoading) return;

    // Hide splash screen once auth state is resolved
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === "(auth)";
    const inTabs = segments[0] === "(tabs)";
    const inPublic = segments[0] === "privacy"; // public routes that require no auth

    if (!isAuthenticated && inTabs) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    } else if (!inAuthGroup && !inTabs && !inPublic) {
      // Initial navigation from the root index — redirect based on auth
      if (isAuthenticated) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [isAuthenticated, isLoading, segments, navigationState?.key]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
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
  const [fontsLoaded] = useFonts({ ...Feather.font, ...Ionicons.font });

  // Don't render anything until fonts are loaded — native splash stays visible
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
