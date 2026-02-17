import { View, Text, TextInput } from "react-native";

export default function CatalogScreen() {
  return (
    <View className="flex-1 bg-slate-950 px-4 py-6">
      {/* Search bar */}
      <View className="bg-slate-900 rounded-xl border border-slate-800 px-4 py-3 mb-6">
        <TextInput
          placeholder="Search foods..."
          placeholderTextColor="#64748b"
          className="text-white text-base"
        />
      </View>

      {/* Empty state */}
      <View className="flex-1 items-center justify-center pb-20">
        <Text className="text-slate-500 text-lg mb-2">No foods yet</Text>
        <Text className="text-slate-600 text-sm text-center px-8">
          Search for a food or quick-add a new one to get started
        </Text>
      </View>
    </View>
  );
}
