import { View, Text, ScrollView } from "react-native";

export default function NutritionScreen() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <ScrollView className="flex-1 bg-slate-950">
      <View className="px-4 py-6">
        <Text className="text-slate-400 text-sm mb-1">{today}</Text>
        <Text className="text-white text-2xl font-bold mb-6">
          Daily Journal
        </Text>

        {/* Calories summary card */}
        <View className="bg-slate-900 rounded-2xl p-5 mb-4 border border-slate-800">
          <Text className="text-slate-400 text-sm mb-2">Calories Today</Text>
          <View className="flex-row items-end gap-2">
            <Text className="text-white text-4xl font-bold">0</Text>
            <Text className="text-slate-500 text-lg mb-1">/ 2,000 kcal</Text>
          </View>
          {/* Progress bar */}
          <View className="h-2 bg-slate-800 rounded-full mt-4">
            <View className="h-2 bg-blue-500 rounded-full w-0" />
          </View>
        </View>

        {/* Macro cards */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Text className="text-slate-400 text-xs">Protein</Text>
            <Text className="text-white text-xl font-bold">0g</Text>
          </View>
          <View className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Text className="text-slate-400 text-xs">Carbs</Text>
            <Text className="text-white text-xl font-bold">0g</Text>
          </View>
          <View className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Text className="text-slate-400 text-xs">Fat</Text>
            <Text className="text-white text-xl font-bold">0g</Text>
          </View>
        </View>

        {/* Meal sections */}
        {["Breakfast", "Lunch", "Dinner", "Snack"].map((meal) => (
          <View
            key={meal}
            className="bg-slate-900 rounded-xl p-4 mb-3 border border-slate-800"
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-white text-lg font-semibold">{meal}</Text>
              <Text className="text-slate-500 text-sm">0 kcal</Text>
            </View>
            <Text className="text-slate-500 text-sm mt-2">
              Tap + to add food
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
