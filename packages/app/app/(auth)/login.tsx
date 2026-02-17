import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import { ApiError } from "../../lib/api";
import ServerIndicator from "../../components/ServerIndicator";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function validate(): string | null {
    if (!email.trim()) return "Email is required";
    if (!email.includes("@")) return "Enter a valid email";
    if (!password) return "Password is required";
    return null;
  }

  async function handleLogin() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError("Invalid email or password");
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
          Track your nutrition, embrace imperfections
        </Text>

        <View className="gap-4">
          {error && (
            <View className="bg-red-950 border border-red-800 rounded-xl px-4 py-3">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

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
            placeholder="Password"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-base"
          />

          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            className="bg-blue-600 rounded-xl py-4 mt-2 active:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Sign In
              </Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text className="text-slate-400 text-center text-sm">
              No account?{" "}
              <Text className="text-blue-400 font-medium">Create one</Text>
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
