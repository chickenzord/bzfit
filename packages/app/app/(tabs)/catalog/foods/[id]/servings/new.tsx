import { useCallback } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTabBarHidden } from "../../../../_layout";
import { apiFetch, ApiError } from "@/lib/api";
import { ServingForm, ServingFormValues } from "@/components/ServingForm";
import { queryKeys } from "@/lib/query-keys";

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
  const queryClient = useQueryClient();
  const { setHidden } = useTabBarHidden();

  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden]),
  );

  const foodQuery = useQuery({
    queryKey: queryKeys.catalog.food(foodId),
    queryFn: () => apiFetch<Food>(`/catalog/foods/${foodId}`),
    enabled: !!foodId,
  });

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
    queryClient.invalidateQueries({ queryKey: queryKeys.catalog.food(foodId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.catalog.needsReview() });
    router.replace(`/catalog/foods/${foodId}?newServingId=${created.id}`);
  }

  if (foodQuery.isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (foodQuery.error || !foodQuery.data) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center px-6">
        <Text className="text-red-400 text-base">
          {foodQuery.error instanceof ApiError
            ? foodQuery.error.message
            : "Failed to load food"}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "New Serving" }} />
      <ServingForm
        food={foodQuery.data}
        onSave={handleSave}
        submitLabel="Add Serving"
        showIsDefault
      />
    </>
  );
}
