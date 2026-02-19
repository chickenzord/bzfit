import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "../../lib/auth";
import { getCustomApiUrl } from "../../lib/storage";

const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [serverUrl, setServerUrl] = useState<string | null>(null);

  useEffect(() => {
    getCustomApiUrl().then((url) => setServerUrl(url ?? DEFAULT_API_BASE));
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

  return (
    <View className="flex-1 bg-slate-950 px-4 py-6">
      <View className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-3">
        <Text className="text-white text-base font-medium">Account</Text>
        <Text className="text-slate-400 text-sm mt-1">Manage your profile</Text>
      </View>

      <View className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-3">
        <Text className="text-white text-base font-medium">API Keys</Text>
        <Text className="text-slate-400 text-sm mt-1">Manage external access</Text>
      </View>

      <View className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-3">
        <Text className="text-white text-base font-medium mb-3">Server</Text>
        <View className="flex-row justify-between items-start">
          <Text className="text-slate-500 text-xs uppercase tracking-wide">URL</Text>
          <Text className="text-slate-300 text-sm text-right flex-shrink ml-4" numberOfLines={2}>
            {serverUrl ?? "—"}
          </Text>
        </View>
      </View>

      <View className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-3">
        <Text className="text-white text-base font-medium">About</Text>
        <Text className="text-slate-400 text-sm mt-1">BzFit v0.1.0</Text>
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
