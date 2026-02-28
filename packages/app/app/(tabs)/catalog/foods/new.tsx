import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, Stack, useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTabBarHidden } from "../../_layout";
import { apiFetch, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

interface CreatedFood {
  id: string;
}

// ServingForm is not reused here because it is a full-screen component owning its
// own ScrollView + KeyboardAvoidingView. Embedding it as a sub-section would
// require extracting its inner fields into a separate sub-component — a non-trivial
// refactor. The serving fields below follow the same visual style instead.

export default function NewFoodScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setHidden } = useTabBarHidden();

  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden]),
  );

  // Food fields
  const [name, setName] = useState("");
  const [variant, setVariant] = useState("");
  const [brand, setBrand] = useState("");

  // Serving fields
  const [servingName, setServingName] = useState("");
  const [sizeStr, setSizeStr] = useState("100");
  const [unit, setUnit] = useState("g");
  const [caloriesStr, setCaloriesStr] = useState("");
  const [proteinStr, setProteinStr] = useState("");
  const [carbsStr, setCarbsStr] = useState("");
  const [fatStr, setFatStr] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const size = parseFloat(sizeStr);
  const isValid = name.trim().length > 0 && !isNaN(size) && size > 0 && unit.trim().length > 0;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setSaveError(null);
    try {
      // 1. Create food
      const food = await apiFetch<CreatedFood>("/catalog/foods", {
        method: "POST",
        body: {
          name: name.trim(),
          ...(variant.trim() ? { variant: variant.trim() } : {}),
          ...(brand.trim() ? { brand: brand.trim() } : {}),
        },
      });

      // 2. Create initial serving
      const servingBody: Record<string, unknown> = {
        foodId: food.id,
        size,
        unit: unit.trim(),
        isDefault: true,
        status: "USER_CREATED",
        ...(servingName.trim() ? { name: servingName.trim() } : { name: null }),
      };
      const cal = parseFloat(caloriesStr);
      const pro = parseFloat(proteinStr);
      const carb = parseFloat(carbsStr);
      const fat = parseFloat(fatStr);
      if (!isNaN(cal)) servingBody.calories = cal;
      if (!isNaN(pro)) servingBody.protein = pro;
      if (!isNaN(carb)) servingBody.carbs = carb;
      if (!isNaN(fat)) servingBody.fat = fat;

      await apiFetch("/catalog/servings", { method: "POST", body: servingBody });

      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.foods() });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.needsReview() });

      router.replace(`/catalog/foods/${food.id}`);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Failed to create food");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "New Food" }} />
      <KeyboardAvoidingView
        className="flex-1 bg-slate-950"
        behavior="padding"
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Food Info */}
          <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">Food Info</Text>

          <Text className="text-slate-500 text-xs mb-1">
            Name <Text className="text-rose-500">*</Text>
          </Text>
          <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-4">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. French Fries"
              placeholderTextColor="#475569"
              style={{ color: "white" }}
              autoFocus
            />
          </View>

          <Text className="text-slate-500 text-xs mb-1">
            Variant <Text className="text-slate-600">(optional)</Text>
          </Text>
          <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-4">
            <TextInput
              value={variant}
              onChangeText={setVariant}
              placeholder="e.g. Curly, Waffle"
              placeholderTextColor="#475569"
              style={{ color: "white" }}
            />
          </View>

          <Text className="text-slate-500 text-xs mb-1">
            Brand <Text className="text-slate-600">(optional)</Text>
          </Text>
          <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-8">
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. McDonald's"
              placeholderTextColor="#475569"
              style={{ color: "white" }}
            />
          </View>

          {/* Initial Serving */}
          <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">Initial Serving</Text>

          <Text className="text-slate-500 text-xs mb-1">
            Name <Text className="text-slate-600">(optional)</Text>
          </Text>
          <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-4">
            <TextInput
              value={servingName}
              onChangeText={setServingName}
              placeholder="e.g. Small, 1 cup"
              placeholderTextColor="#475569"
              style={{ color: "white" }}
            />
          </View>

          <View className="flex-row gap-3 mb-6">
            <View className="flex-[2]">
              <Text className="text-slate-500 text-xs mb-1">
                Size <Text className="text-rose-500">*</Text>
              </Text>
              <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                <TextInput
                  value={sizeStr}
                  onChangeText={setSizeStr}
                  keyboardType="decimal-pad"
                  style={{ color: "white" }}
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-slate-500 text-xs mb-1">
                Unit <Text className="text-rose-500">*</Text>
              </Text>
              <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                <TextInput
                  value={unit}
                  onChangeText={setUnit}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="g"
                  placeholderTextColor="#475569"
                  style={{ color: "white" }}
                />
              </View>
            </View>
          </View>

          {/* Nutrition */}
          <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">
            Nutrition{" "}
            <Text className="text-slate-600 normal-case tracking-normal">(per serving, optional)</Text>
          </Text>

          {[
            { label: "Calories", unit: "kcal", value: caloriesStr, onChange: setCaloriesStr },
            { label: "Protein", unit: "g", value: proteinStr, onChange: setProteinStr },
            { label: "Carbs", unit: "g", value: carbsStr, onChange: setCarbsStr },
            { label: "Fat", unit: "g", value: fatStr, onChange: setFatStr },
          ].map(({ label, unit: u, value, onChange }) => (
            <View key={label} className="mb-3">
              <Text className="text-slate-500 text-xs mb-1">
                {label} <Text className="text-slate-600">({u})</Text>
              </Text>
              <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor="#475569"
                  style={{ color: "white" }}
                />
              </View>
            </View>
          ))}

          <View className="mb-4" />

          {saveError && (
            <View className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-400 text-sm">{saveError}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSave}
            disabled={!isValid || saving}
            className={`py-4 rounded-xl items-center ${
              !isValid || saving ? "bg-blue-500/30" : "bg-blue-500"
            }`}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text
                className={`font-semibold text-base ${!isValid ? "text-slate-500" : "text-white"}`}
              >
                Create Food
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
