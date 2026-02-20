import { useState, useCallback, useEffect } from "react";
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ApiError, apiFetch } from "../../../../lib/api";
import { FlashMessage } from "../../../../components/FlashMessage";

interface Serving {
  id: string;
  name: string | null;
  size: number;
  unit: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  isDefault: boolean;
  status: "VERIFIED" | "NEEDS_REVIEW" | "USER_CREATED";
}

interface Food {
  id: string;
  name: string;
  variant: string | null;
  brand: string | null;
  servings: Serving[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABEL: Record<Serving["status"], string> = {
  VERIFIED: "Verified",
  NEEDS_REVIEW: "Needs Review",
  USER_CREATED: "User Created",
};

export default function FoodDetailsScreen() {
  const { id, editedServingId } = useLocalSearchParams<{ id: string; editedServingId?: string }>();
  const router = useRouter();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (!editedServingId) return;
    setHighlightedId(editedServingId);
    const t = setTimeout(() => setHighlightedId(null), 3000);
    return () => clearTimeout(t);
  }, [editedServingId]);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      setError(null);
      apiFetch<Food>(`/catalog/foods/${id}`)
        .then(setFood)
        .catch((err) =>
          setError(err instanceof ApiError ? err.message : "An unexpected error occurred.")
        )
        .finally(() => setLoading(false));
    }, [id])
  );

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center px-4">
        <Text className="text-red-400 text-base mb-2">{error}</Text>
      </View>
    );
  }

  if (!food) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center px-4">
        <Text className="text-slate-500 text-base">Food not found</Text>
      </View>
    );
  }

  const displayName = [food.name, food.variant].filter(Boolean).join(" · ");

  return (
    <ScrollView className="flex-1 bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-white text-2xl font-bold">{displayName}</Text>
      {food.brand && (
        <Text className="text-slate-400 text-sm mt-1 mb-4">{food.brand}</Text>
      )}

      <FlashMessage visible={!!highlightedId} message="Serving updated" />

      <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3 mt-2">
        Servings
      </Text>

      {food.servings.length === 0 && (
        <Text className="text-slate-600 text-sm">No serving sizes available.</Text>
      )}

      {food.servings.map((serving) => {
        const needsReview = serving.status === "NEEDS_REVIEW";
        return (
          <View
            key={serving.id}
            className={`p-4 rounded-xl mb-3 border ${
              highlightedId === serving.id
                ? "bg-green-500/5 border-green-500/40"
                : "bg-slate-900 border-slate-800"
            }`}
          >
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 mr-2">
                <Text className="text-white text-base font-semibold">
                  {serving.name ?? `${serving.size}${serving.unit}`}
                </Text>
                <Text className="text-slate-500 text-xs mt-0.5">
                  {serving.size}{serving.unit}
                  {serving.isDefault && " · default"}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                {needsReview && (
                  <View className="flex-row items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    <Ionicons name="alert-circle-outline" size={11} color="#f59e0b" />
                    <Text className="text-amber-500 text-xs">{STATUS_LABEL[serving.status]}</Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => router.push(`/catalog/servings/${serving.id}`)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="pencil-outline" size={16} color="#475569" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-x-4 gap-y-1">
              {[
                { label: "Cal", value: serving.calories, unit: "kcal" },
                { label: "Protein", value: serving.protein, unit: "g" },
                { label: "Carbs", value: serving.carbs, unit: "g" },
                { label: "Fat", value: serving.fat, unit: "g" },
              ].map(({ label, value, unit }) => (
                <Text key={label} className="text-slate-500 text-xs">
                  {label}:{" "}
                  <Text className={value != null ? "text-slate-300" : "text-slate-600"}>
                    {value != null ? `${value}${unit}` : "—"}
                  </Text>
                </Text>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
