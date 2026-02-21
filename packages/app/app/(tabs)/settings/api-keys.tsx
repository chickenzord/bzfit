import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Clipboard,
  Linking,
} from "react-native";
import { apiFetch, ApiError } from "@/lib/api";
import { Icon } from "@/lib/icons";
import { getCustomApiUrl } from "@/lib/storage";

const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

type ApiKey = {
  id: string;
  name: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsed: string | null;
  createdAt: string;
};

type NewKeyResult = ApiKey & { key: string };

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ApiKeysScreen() {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Newly created key (shown once)
  const [newKey, setNewKey] = useState<NewKeyResult | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ApiKey[]>("/auth/api-keys");
      setKeys(data);
    } catch {
      setError("Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
    getCustomApiUrl().then((url) => setServerUrl(url ?? DEFAULT_API_BASE));
  }, [loadKeys]);

  async function handleCreate() {
    if (!name.trim()) {
      setCreateError("Name is required.");
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      const scopeList = scopes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const result = await apiFetch<NewKeyResult>("/auth/api-keys", {
        method: "POST",
        body: { name: name.trim(), scopes: scopeList },
      });
      setNewKey(result);
      setName("");
      setScopes("");
      setShowForm(false);
      setKeyCopied(false);
      await loadKeys();
    } catch (e) {
      if (e instanceof ApiError) {
        setCreateError(e.message);
      } else {
        setCreateError("Failed to create API key.");
      }
    } finally {
      setCreating(false);
    }
  }

  function handleRevoke(key: ApiKey) {
    Alert.alert("Revoke API Key", `Revoke "${key.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/auth/api-keys/${key.id}`, { method: "DELETE" });
            setKeys((prev) => prev.filter((k) => k.id !== key.id));
            if (newKey?.id === key.id) setNewKey(null);
          } catch {
            Alert.alert("Error", "Failed to revoke API key.");
          }
        },
      },
    ]);
  }

  function handleCopy(value: string) {
    Clipboard.setString(value);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* New key reveal */}
      {newKey && (
        <View className="bg-emerald-950 border border-emerald-700 rounded-xl p-4 mb-5">
          <View className="flex-row items-center gap-2 mb-2">
            <Icon name="key" size={15} color="#34d399" />
            <Text className="text-emerald-400 font-semibold text-sm">API key created — save it now</Text>
          </View>
          <Text className="text-slate-400 text-xs mb-3">
            This key is shown only once. Copy and store it securely.
          </Text>
          <View className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 flex-row items-center gap-2 mb-3">
            <Text className="text-emerald-300 text-xs font-mono flex-1" selectable numberOfLines={1}>
              {newKey.key}
            </Text>
            <TouchableOpacity onPress={() => handleCopy(newKey.key)}>
              <Icon name={keyCopied ? "check" : "copy"} size={15} color={keyCopied ? "#34d399" : "#94a3b8"} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setNewKey(null)}>
            <Text className="text-slate-500 text-xs text-right">Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Create form */}
      {showForm ? (
        <View className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5">
          <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">New API Key</Text>

          {createError && (
            <View className="bg-red-950 border border-red-800 rounded-lg px-3 py-2 mb-3">
              <Text className="text-red-400 text-xs">{createError}</Text>
            </View>
          )}

          <Text className="text-slate-500 text-xs mb-1">Name</Text>
          <View className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 mb-4">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. My Home Server"
              placeholderTextColor="#475569"
              style={{ color: "white" }}
              autoFocus
            />
          </View>

          <Text className="text-slate-500 text-xs mb-1">
            Scopes{" "}
            <Text className="text-slate-600">(comma-separated, leave blank for all)</Text>
          </Text>
          <View className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 mb-4">
            <TextInput
              value={scopes}
              onChangeText={setScopes}
              placeholder="e.g. read:meals, write:foods"
              placeholderTextColor="#475569"
              style={{ color: "white" }}
              autoCapitalize="none"
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                setShowForm(false);
                setName("");
                setScopes("");
                setCreateError(null);
              }}
              className="flex-1 border border-slate-700 rounded-xl py-3 items-center"
            >
              <Text className="text-slate-400 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={creating}
              className="flex-1 bg-blue-600 rounded-xl py-3 items-center disabled:opacity-50"
            >
              {creating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white font-semibold">Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="flex-row items-center justify-center gap-2 bg-blue-600 rounded-xl py-3 mb-5"
        >
          <Icon name="plus" size={16} color="#fff" />
          <Text className="text-white font-semibold">New API Key</Text>
        </TouchableOpacity>
      )}

      {/* Keys list */}
      <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">
        Your Keys
      </Text>

      {loading ? (
        <ActivityIndicator color="#94a3b8" />
      ) : error ? (
        <View className="bg-red-950 border border-red-800 rounded-xl px-4 py-3">
          <Text className="text-red-400 text-sm">{error}</Text>
        </View>
      ) : keys.length === 0 ? (
        <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-6 items-center">
          <Icon name="key" size={24} color="#475569" />
          <Text className="text-slate-500 text-sm mt-2">No API keys yet</Text>
        </View>
      ) : (
        keys.map((k) => (
          <View key={k.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-3">
            <View className="flex-row items-start justify-between mb-2">
              <Text className="text-white font-medium flex-1 mr-2">{k.name}</Text>
              <TouchableOpacity onPress={() => handleRevoke(k)}>
                <Icon name="trash" size={15} color="#f87171" />
              </TouchableOpacity>
            </View>

            {k.scopes.length > 0 && (
              <View className="flex-row flex-wrap gap-1 mb-2">
                {k.scopes.map((s) => (
                  <View key={s} className="bg-slate-800 rounded px-2 py-0.5">
                    <Text className="text-slate-400 text-xs">{s}</Text>
                  </View>
                ))}
              </View>
            )}

            <View className="flex-row justify-between mt-1">
              <Text className="text-slate-600 text-xs">Created {formatDate(k.createdAt)}</Text>
              <Text className="text-slate-600 text-xs">Last used: {formatDate(k.lastUsed)}</Text>
            </View>

            {k.expiresAt && (
              <Text className="text-amber-600 text-xs mt-1">Expires {formatDate(k.expiresAt)}</Text>
            )}
          </View>
        ))
      )}
      {/* API Docs info */}
      <View className="bg-slate-900 border border-slate-800 rounded-xl p-4 mt-2">
        <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">API Documentation</Text>
        <Text className="text-slate-500 text-xs mb-2">
          Use API keys to authenticate external apps and scripts. Pass the key as a query param or header:
        </Text>
        <View className="bg-slate-800 rounded-lg px-3 py-2 mb-2">
          <Text className="text-slate-400 text-xs font-mono">?api_key=YOUR_KEY</Text>
        </View>
        <View className="bg-slate-800 rounded-lg px-3 py-2 mb-3">
          <Text className="text-slate-400 text-xs font-mono">Authorization: ApiKey YOUR_KEY</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center gap-1"
          onPress={() => serverUrl && Linking.openURL(`${serverUrl}/api/docs`)}
          disabled={!serverUrl}
        >
          <Text className="text-blue-400 text-xs">{serverUrl ? `${serverUrl}/api/docs` : "Loading..."}</Text>
          <Icon name="external-link" size={11} color="#60a5fa" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
