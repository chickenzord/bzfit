import { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import icon from "@/assets/icon.png";

const MIN_SPLASH_MS = 1000;

export default function SplashScreen() {
  const { isLoading, isAuthenticated } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading || !minElapsed) return;
    if (isAuthenticated) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [isLoading, isAuthenticated, minElapsed]);

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <Image source={icon} style={styles.icon} resizeMode="contain" />
        <View style={styles.textGroup}>
          <Text style={styles.title}>BzFit</Text>
          <Text style={styles.tagline}>
            Track your nutrition, embrace imperfections
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.credit}>by akhy.dev</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  center: {
    alignItems: "center",
    gap: 16,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  textGroup: {
    alignItems: "center",
    gap: 4,
  },
  title: {
    color: "#f8fafc",
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  tagline: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 40,
  },
  credit: {
    color: "#334155",
    fontSize: 12,
  },
});
