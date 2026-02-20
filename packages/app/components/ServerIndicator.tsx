import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getCustomApiUrl,
  setCustomApiUrl,
  removeCustomApiUrl,
} from "../lib/storage";

const DEFAULT_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

function getHostLabel(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

type PingStatus = "idle" | "pinging" | "ok" | "error";
type TestStatus = "idle" | "testing" | "ok" | "error";

export default function ServerIndicator() {
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [saving, setSaving] = useState(false);
  const [pingStatus, setPingStatus] = useState<PingStatus>("idle");
  const pingControllerRef = useRef<AbortController | null>(null);

  const ping = useCallback(async (url: string) => {
    pingControllerRef.current?.abort();
    const controller = new AbortController();
    pingControllerRef.current = controller;
    setPingStatus("pinging");
    try {
      const res = await fetch(`${url}/api/v1/ping`, { signal: controller.signal });
      const data = await res.json();
      setPingStatus(data?.ok === true ? "ok" : "error");
    } catch {
      if (!controller.signal.aborted) setPingStatus("error");
    }
  }, []);

  const loadUrl = useCallback(async () => {
    const custom = await getCustomApiUrl();
    setCurrentUrl(custom ?? DEFAULT_URL);
  }, []);

  useEffect(() => {
    loadUrl();
  }, [loadUrl]);

  useEffect(() => {
    ping(currentUrl);
  }, [currentUrl, ping]);

  function openModal() {
    setInputUrl(currentUrl);
    setTestStatus("idle");
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setTestStatus("idle");
  }

  async function handleTest() {
    const trimmed = inputUrl.trim().replace(/\/$/, "");
    if (!trimmed) return;
    setTestStatus("testing");
    try {
      const res = await fetch(`${trimmed}/api/v1/ping`);
      const data = await res.json();
      setTestStatus(data?.ok === true ? "ok" : "error");
    } catch {
      setTestStatus("error");
    }
  }

  async function handleSave() {
    const trimmed = inputUrl.trim().replace(/\/$/, "");
    if (!trimmed) return;
    setSaving(true);
    try {
      await setCustomApiUrl(trimmed);
      setCurrentUrl(trimmed);
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    await removeCustomApiUrl();
    setCurrentUrl(DEFAULT_URL);
    closeModal();
  }

  const isDefault = currentUrl === DEFAULT_URL;

  return (
    <>
      <TouchableOpacity
        onPress={openModal}
        className="flex-row items-center justify-center gap-1.5 py-3"
      >
        <View
          className={`w-1.5 h-1.5 rounded-full ${
            pingStatus === "ok"
              ? "bg-green-400"
              : pingStatus === "error"
              ? "bg-red-400"
              : "bg-slate-600"
          }`}
        />
        <Text className="text-slate-500 text-xs">
          Using {getHostLabel(currentUrl)}
        </Text>
        <Ionicons name="pencil-outline" size={11} color="#475569" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-end bg-black/60">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View className="bg-slate-900 rounded-t-3xl p-6 border-t border-slate-800">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-xl font-bold">Server URL</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              <Text className="text-slate-500 text-xs mb-5">
                Point the app to any BzFit instance on your network.
              </Text>

              <TextInput
                value={inputUrl}
                onChangeText={(v) => {
                  setInputUrl(v);
                  setTestStatus("idle");
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="http://192.168.x.x:3001"
                placeholderTextColor="#475569"
                style={{ color: "white", fontSize: 15 }}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-3"
              />

              {testStatus !== "idle" && (
                <View className="flex-row items-center gap-2 mb-3 px-1">
                  {testStatus === "testing" && (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  )}
                  {testStatus === "ok" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#22c55e"
                    />
                  )}
                  {testStatus === "error" && (
                    <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  )}
                  <Text
                    className={`text-sm ${
                      testStatus === "ok"
                        ? "text-green-400"
                        : testStatus === "error"
                        ? "text-red-400"
                        : "text-slate-400"
                    }`}
                  >
                    {testStatus === "testing"
                      ? "Testing connection…"
                      : testStatus === "ok"
                      ? "Server reachable"
                      : "Could not reach server"}
                  </Text>
                </View>
              )}

              <View className="flex-row gap-3 mb-3">
                <TouchableOpacity
                  onPress={handleTest}
                  disabled={testStatus === "testing" || !inputUrl.trim()}
                  className="flex-1 py-3 rounded-xl border border-slate-700 items-center disabled:opacity-40"
                >
                  <Text className="text-slate-300 text-sm font-medium">
                    Test
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving || !inputUrl.trim()}
                  className="flex-1 py-3 rounded-xl bg-blue-500 items-center disabled:opacity-40"
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white text-sm font-semibold">
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {!isDefault && (
                <TouchableOpacity
                  onPress={handleReset}
                  className="items-center py-2"
                >
                  <Text className="text-slate-500 text-xs">
                    Reset to default ({getHostLabel(DEFAULT_URL)})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}
