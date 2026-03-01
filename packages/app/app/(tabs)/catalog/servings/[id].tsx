import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTabBarHidden } from "../../_layout";
import { apiFetch, ApiError } from "@/lib/api";
import { ServingForm, ServingFormValues } from "@/components/ServingForm";
import { NutritionImportModal } from "@/components/catalog/NutritionImportModal";
import { queryKeys } from "@/lib/query-keys";
import { useUpdateServing } from "@/lib/catalog";
import { Icon } from "@/lib/icons";

interface Serving {
  id: string;
  foodId: string;
  name: string | null;
  size: number;
  unit: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  status: "VERIFIED" | "NEEDS_REVIEW" | "USER_CREATED";
  updatedAt: string;
}

interface Food {
  id: string;
  name: string;
  variant: string | null;
  brand: string | null;
}

function numStr(v: number | null): string {
  return v != null ? String(v) : "";
}

export default function ServingEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { setHidden } = useTabBarHidden();
  const updateServingMutation = useUpdateServing();
  const [importModalVisible, setImportModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden]),
  );

  const servingQuery = useQuery({
    queryKey: queryKeys.catalog.serving(id),
    queryFn: async () => {
      const serving = await apiFetch<Serving>(`/catalog/servings/${id}`);
      const food = await apiFetch<Food>(`/catalog/foods/${serving.foodId}`);
      return { serving, food };
    },
    enabled: !!id,
  });

  async function handleSave(values: ServingFormValues) {
    const size = parseFloat(values.sizeStr);
    const data: Record<string, unknown> = {
      name: values.name.trim() || null,
      size,
      unit: values.unitStr.trim(),
      status: values.status,
    };
    const cal = parseFloat(values.caloriesStr);
    const pro = parseFloat(values.proteinStr);
    const carb = parseFloat(values.carbsStr);
    const fat = parseFloat(values.fatStr);
    if (!isNaN(cal)) data.calories = cal;
    if (!isNaN(pro)) data.protein = pro;
    if (!isNaN(carb)) data.carbs = carb;
    if (!isNaN(fat)) data.fat = fat;

    const food = servingQuery.data!.food;
    await updateServingMutation.mutateAsync({ id, foodId: food.id, data });
    router.replace(`/catalog/foods/${food.id}?editedServingId=${id}`);
  }

  if (servingQuery.isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (servingQuery.error || !servingQuery.data) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center px-6">
        <Text className="text-red-400 text-base">
          {servingQuery.error instanceof ApiError
            ? servingQuery.error.message
            : "Failed to load serving"}
        </Text>
      </View>
    );
  }

  const { serving, food } = servingQuery.data;

  return (
    <>
      <Stack.Screen
        options={{
          title: serving.name ?? `${serving.size}${serving.unit}`,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setImportModalVisible(true)}
              hitSlop={12}
              className="flex-row items-center gap-1.5 mr-1"
            >
              <Icon name="cpu" size={16} color="#3b82f6" />
              <Text className="text-blue-400 text-sm font-medium">Import</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <NutritionImportModal
        visible={importModalVisible}
        servingId={id}
        servingSize={serving.size}
        servingUnit={serving.unit}
        onClose={() => setImportModalVisible(false)}
        onApplied={() => setImportModalVisible(false)}
      />
      <ServingForm
        key={serving.updatedAt}
        food={food}
        initialValues={{
          name: serving.name ?? "",
          sizeStr: String(serving.size),
          unitStr: serving.unit,
          caloriesStr: numStr(serving.calories),
          proteinStr: numStr(serving.protein),
          carbsStr: numStr(serving.carbs),
          fatStr: numStr(serving.fat),
          status: serving.status,
        }}
        onSave={handleSave}
        submitLabel="Save Changes"
        showIsDefault={false}
      />
    </>
  );
}
