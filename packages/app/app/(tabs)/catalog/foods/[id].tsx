import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ApiError, apiFetch } from "../../../../lib/api";

interface Serving {
  id: string;
  name: string | null; // Renamed from description
  size: number; // Renamed from grams
  unit: string; // Added
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isDefault: boolean; // Renamed from is_base_serving
}

interface Food {
  id: string;
  name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: Serving[];
}

export default function FoodDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchFoodDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<Food>(`/catalog/foods/${id}`);
        setFood(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFoodDetails();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#e2e8f0" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center px-4">
        <Text className="text-red-500 text-lg mb-2">Error: {error}</Text>
        <Text className="text-slate-600 text-sm text-center">
          Could not load food details. Please try again.
        </Text>
      </View>
    );
  }

  if (!food) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center px-4">
        <Text className="text-slate-500 text-lg mb-2">Food not found</Text>
        <Text className="text-slate-600 text-sm text-center">
          The food you are looking for does not exist.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950 px-4 py-6">
      <Text className="text-white text-2xl font-bold">{food.name}</Text>
      {food.brand && <Text className="text-slate-400 text-base mb-4">{food.brand}</Text>}



      <Text className="text-white text-xl font-bold mb-3">Servings</Text>
      {food.servings.length === 0 && (
        <Text className="text-slate-500">No serving sizes available.</Text>
      )}
      {food.servings.map((serving) => (
        <View key={serving.id} className="bg-slate-800 p-4 rounded-xl mb-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-white text-lg font-semibold">{serving.name}</Text>
            <Text className="text-slate-400 text-sm">{serving.size}{serving.unit}</Text>
          </View>
          <View className="flex-row flex-wrap justify-between mt-2">
            <Text className="text-slate-300">Cal: <Text className="text-white">{serving.calories}</Text></Text>
            <Text className="text-slate-300">Prot: <Text className="text-white">{serving.protein}g</Text></Text>
            <Text className="text-slate-300">Carbs: <Text className="text-white">{serving.carbs}g</Text></Text>
            <Text className="text-slate-300">Fat: <Text className="text-white">{serving.fat}g</Text></Text>
          </View>
        </View>
      ))}
    </View>
  );
}
