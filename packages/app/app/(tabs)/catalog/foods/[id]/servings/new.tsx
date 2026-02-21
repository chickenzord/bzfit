import { useState, useEffect, useCallback } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import { useTabBarHidden } from "../../../../../_layout";
import { apiFetch, ApiError } from "../../../../../../lib/api";
import { ServingForm, ServingFormValues } from "../../../../../../components/ServingForm";

interface Food {
  id: string;
  name: string;
  variant: string | null;
  brand: string | null;
}

interface CreatedServing {
  id: string;
}

export default function NewServingScreen() {
  const { id: foodId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { setHidden } = useTabBarHidden();

  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden])
  );

  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!foodId) return;
    apiFetch<Food>(`/catalog/foods/${foodId}`)
      .then(setFood)
      .catch((e: unknown) => setLoadError(e instanceof ApiError ? e.message : "Failed to load food"))
      .finally(() => setLoading(false));
  }, [foodId]);

  async function handleSave(values: ServingFormValues) {
    const size = parseFloat(values.sizeStr);
    const body: Record<string, unknown> = {
      foodId,
      name: values.name.trim() || null,
      size,
      unit: values.unitStr.trim(),
      status: values.status,
      isDefault: values.isDefault,
    };
    const cal = parseFloat(values.caloriesStr);
    const pro = parseFloat(values.proteinStr);
    const carb = parseFloat(values.carbsStr);
    const fat = parseFloat(values.fatStr);
    if (!isNaN(cal)) body.calories = cal;
    if (!isNaN(pro)) body.protein = pro;
    if (!isNaN(carb)) body.carbs = carb;
    if (!isNaN(fat)) body.fat = fat;

    const created = await apiFetch<CreatedServing>(`/catalog/servings`, { method: "POST", body });
    router.replace(`/catalog/foods/${foodId}?newServingId=${created.id}`);
  }

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (loadError || !food) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center px-6">
        <Text className="text-red-400 text-base">{loadError ?? "Failed to load food"}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "New Serving" }} />
      <ServingForm
        food={food}
        onSave={handleSave}
        submitLabel="Add Serving"
        showIsDefault
      />
    </>
  );
}
