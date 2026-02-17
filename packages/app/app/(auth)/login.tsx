import { View, Text, TextInput, Pressable } from "react-native";

export default function LoginScreen() {
  return (
    <View className="flex-1 bg-slate-950 justify-center px-6">
      <Text className="text-white text-3xl font-bold text-center mb-2">
        BzFit
      </Text>
      <Text className="text-slate-400 text-center mb-10">
        Track your nutrition, embrace imperfections
      </Text>

      <View className="gap-4">
        <TextInput
          placeholder="Username"
          placeholderTextColor="#64748b"
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-base"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#64748b"
          secureTextEntry
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-base"
        />
        <Pressable className="bg-blue-600 rounded-xl py-4 mt-2 active:bg-blue-700">
          <Text className="text-white text-center font-semibold text-base">
            Sign In
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
