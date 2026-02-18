import { View, Text } from "react-native";

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-slate-950 px-4 py-6">
      <View className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-3">
        <Text className="text-white text-base font-medium">Account</Text>
        <Text className="text-slate-400 text-sm mt-1">
          Manage your profile
        </Text>
      </View>
      <View className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-3">
        <Text className="text-white text-base font-medium">API Keys</Text>
        <Text className="text-slate-400 text-sm mt-1">
          Manage external access
        </Text>
      </View>
      <View className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <Text className="text-white text-base font-medium">About</Text>
        <Text className="text-slate-400 text-sm mt-1">BzFit v0.1.0</Text>
      </View>
    </View>
  );
}
