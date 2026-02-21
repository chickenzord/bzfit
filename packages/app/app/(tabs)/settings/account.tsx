import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/api";

export default function AccountScreen() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function validate(): string | null {
    if (!currentPassword) return "Current password is required";
    if (!newPassword) return "New password is required";
    if (newPassword.length < 8) return "New password must be at least 8 characters";
    if (newPassword !== confirmPassword) return "Passwords do not match";
    return null;
  }

  async function handleChangePassword() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword, confirmPassword },
      });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError("Current password is incorrect");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-950"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {/* Profile info */}
        <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">Profile</Text>
        <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-6">
          <Text className="text-slate-500 text-xs mb-0.5">Email</Text>
          <Text className="text-white text-base">{user?.email ?? "—"}</Text>
        </View>

        {/* Change password */}
        <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">Change Password</Text>

        {success && (
          <View className="bg-green-950 border border-green-800 rounded-xl px-4 py-3 mb-4">
            <Text className="text-green-400 text-sm">Password changed successfully.</Text>
          </View>
        )}

        {error && (
          <View className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}

        <Text className="text-slate-500 text-xs mb-1">Current Password</Text>
        <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-4">
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Enter current password"
            placeholderTextColor="#475569"
            style={{ color: "white" }}
          />
        </View>

        <Text className="text-slate-500 text-xs mb-1">New Password</Text>
        <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-4">
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="At least 8 characters"
            placeholderTextColor="#475569"
            style={{ color: "white" }}
          />
        </View>

        <Text className="text-slate-500 text-xs mb-1">Confirm New Password</Text>
        <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-6">
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Repeat new password"
            placeholderTextColor="#475569"
            style={{ color: "white" }}
          />
        </View>

        <TouchableOpacity
          onPress={handleChangePassword}
          disabled={saving}
          className="bg-blue-600 rounded-xl py-4 items-center disabled:opacity-50"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Change Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
