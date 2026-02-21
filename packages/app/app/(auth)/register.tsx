import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import ServerIndicator from "@/components/ServerIndicator";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function validate(): string | null {
    if (!email.trim()) return "Email is required";
    if (!email.includes("@")) return "Enter a valid email";
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return null;
  }

  async function handleRegister() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await register(email.trim(), password, name.trim() || undefined);
      router.replace("/(tabs)");
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setError("Registration is disabled on this server");
      } else if (e instanceof ApiError && e.status === 409) {
        setError("An account with this email already exists");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-950 px-6">
      <View className="flex-1 justify-center">
        <Text className="text-white text-3xl font-bold text-center mb-2">
          BzFit
        </Text>
        <Text className="text-slate-400 text-center mb-10">
          Create your account
        </Text>

        <View className="gap-4">
          {error && (
            <View className="bg-red-950 border border-red-800 rounded-xl px-4 py-3">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          <TextInput
            placeholder="Name (optional)"
            placeholderTextColor="#64748b"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-base"
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-base"
          />
          <TextInput
            placeholder="Password (min 8 characters)"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-base"
          />

          <Pressable
            onPress={handleRegister}
            disabled={isLoading}
            className="bg-blue-600 rounded-xl py-4 mt-2 active:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Create Account
              </Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.back()}>
            <Text className="text-slate-400 text-center text-sm">
              Already have an account?{" "}
              <Text className="text-blue-400 font-medium">Sign in</Text>
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="pb-8">
        <ServerIndicator />
      </View>
    </View>
  );
}
