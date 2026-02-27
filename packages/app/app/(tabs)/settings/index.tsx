import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Icon } from "@/lib/icons";
import { useAuth } from "@/lib/auth";
import { getCustomApiUrl } from "@/lib/storage";
import { fetchServerInfo } from "@/lib/api";

const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";
const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [serverVersionLoading, setServerVersionLoading] = useState(true);

  useEffect(() => {
    getCustomApiUrl().then((url) => {
      const base = url ?? DEFAULT_API_BASE;
      setServerUrl(base);

      fetchServerInfo(base)
        .then((info) => setServerVersion(info?.version ?? null))
        .catch(() => setServerVersion(null))
        .finally(() => setServerVersionLoading(false));
    });
  }, []);

  function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }

  const versionMismatch =
    serverVersion !== null && serverVersion !== APP_VERSION;

  return (
    <View className="flex-1 bg-slate-950 px-4 py-6">
      <TouchableOpacity
        onPress={() => router.push("/settings/goals" as any)}
        className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-3 flex-row items-center justify-between"
      >
        <View>
          <Text className="text-white text-base font-medium">Nutrition Goals</Text>
          <Text className="text-slate-400 text-sm mt-1">Manage daily targets</Text>
        </View>
        <Icon name="chevron-right" size={18} color="#475569" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/settings/account" as any)}
        className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-3 flex-row items-center justify-between"
      >
        <View>
          <Text className="text-white text-base font-medium">Account</Text>
          <Text className="text-slate-400 text-sm mt-1">Manage your profile</Text>
        </View>
        <Icon name="chevron-right" size={18} color="#475569" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/settings/api-keys" as any)}
        className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-3 flex-row items-center justify-between"
      >
        <View>
          <Text className="text-white text-base font-medium">API Keys</Text>
          <Text className="text-slate-400 text-sm mt-1">Manage external access</Text>
        </View>
        <Icon name="chevron-right" size={18} color="#475569" />
      </TouchableOpacity>

      <View className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-3">
        <Text className="text-white text-base font-medium mb-3">About</Text>

        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-slate-400 text-sm">App version</Text>
          <Text className="text-slate-300 text-sm">v{APP_VERSION}</Text>
        </View>

        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-slate-400 text-sm">Server version</Text>
          {serverVersionLoading ? (
            <ActivityIndicator size="small" color="#475569" />
          ) : serverVersion ? (
            <View className="flex-row items-center gap-1.5">
              {versionMismatch && (
                <Icon name="alert-circle" size={13} color="#f59e0b" />
              )}
              <Text
                className={`text-sm ${versionMismatch ? "text-amber-400" : "text-slate-300"}`}
              >
                v{serverVersion}
              </Text>
            </View>
          ) : (
            <Text className="text-slate-500 text-sm">unavailable</Text>
          )}
        </View>

        {versionMismatch && (
          <Text className="text-amber-400/80 text-xs mt-1 mb-2">
            App and server versions differ — consider updating.
          </Text>
        )}

        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-slate-400 text-sm">Server URL</Text>
          <Text className="text-slate-300 text-sm text-right flex-shrink ml-4" numberOfLines={2}>
            {serverUrl ?? "—"}
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.push("/privacy" as any)} className="flex-row justify-between items-center">
          <Text className="text-slate-400 text-sm">Privacy Policy</Text>
          <Icon name="chevron-right" size={14} color="#475569" />
        </TouchableOpacity>
      </View>

      <View className="mt-auto">
        <TouchableOpacity
          onPress={handleLogout}
          disabled={loggingOut}
          className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 items-center flex-row justify-center gap-2"
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#f43f5e" />
          ) : (
            <Text className="text-rose-400 text-base font-semibold">Log Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
