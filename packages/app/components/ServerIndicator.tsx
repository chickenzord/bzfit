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
import { Icon, type IconName } from "../lib/icons";
import {
  getCustomApiUrl,
  setCustomApiUrl,
  removeCustomApiUrl,
} from "../lib/storage";
import { fetchServerInfo } from "../lib/api";

function getDefaultUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:3001";
}

const DEFAULT_URL = getDefaultUrl();

function getHostLabel(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

type PingStatus = "idle" | "pinging" | "ok" | "error";
type TestStatus = "idle" | "testing" | "ok" | "error";

type Props = {
  onServerInfo?: (info: { registrationEnabled: boolean } | null) => void;
};

export default function ServerIndicator({ onServerInfo }: Props) {
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testRegistrationEnabled, setTestRegistrationEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [pingStatus, setPingStatus] = useState<PingStatus>("idle");
  const pingControllerRef = useRef<AbortController | null>(null);

  const ping = useCallback(async (url: string) => {
    pingControllerRef.current?.abort();
    const controller = new AbortController();
    pingControllerRef.current = controller;
    setPingStatus("pinging");
    try {
      const info = await fetchServerInfo(url);
      if (controller.signal.aborted) return;
      if (info?.name === 'BzFit') {
        setPingStatus("ok");
        onServerInfo?.({ registrationEnabled: info.registrationEnabled });
      } else {
        setPingStatus("error");
        onServerInfo?.(null);
      }
    } catch {
      if (!controller.signal.aborted) {
        setPingStatus("error");
        onServerInfo?.(null);
      }
    }
  }, [onServerInfo]);

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
    setTestRegistrationEnabled(null);
    try {
      const info = await fetchServerInfo(trimmed);
      if (info?.name === 'BzFit') {
        setTestStatus("ok");
        setTestRegistrationEnabled(info.registrationEnabled);
      } else {
        setTestStatus("error");
      }
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
        <Icon name="edit" size={11} color="#475569" />
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
                  <Icon name="close" size={24} color="#94a3b8" />
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
                  setTestRegistrationEnabled(null);
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
                <View className="gap-1 mb-3 px-1">
                  <View className="flex-row items-center gap-2">
                    {testStatus === "testing" && (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    )}
                    {testStatus === "ok" && (
                      <Icon name="check-circle" size={16} color="#22c55e" />
                    )}
                    {testStatus === "error" && (
                      <Icon name="alert-circle" size={16} color="#ef4444" />
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
                        ? "BzFit server reachable"
                        : "Could not reach a BzFit server"}
                    </Text>
                  </View>
                  {testStatus === "ok" && testRegistrationEnabled === false && (
                    <Text className="text-amber-400 text-xs ml-6">
                      Registration is disabled on this server
                    </Text>
                  )}
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
