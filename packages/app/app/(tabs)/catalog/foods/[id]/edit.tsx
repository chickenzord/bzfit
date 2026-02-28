import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTabBarHidden } from "../../../_layout";
import { Icon } from "@/lib/icons";
import { apiFetch, ApiError } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import { queryKeys } from "@/lib/query-keys";
import { useUpdateFood, useUpdateServing, useDeleteServing } from "@/lib/catalog";

interface Serving {
  id: string;
  name: string | null;
  size: number;
  unit: string;
  isDefault: boolean;
}

interface Food {
  id: string;
  name: string;
  variant: string | null;
  brand: string | null;
  servings: Serving[];
}

export default function FoodEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setHidden } = useTabBarHidden();

  const updateFoodMutation = useUpdateFood();
  const updateServingMutation = useUpdateServing();
  const deleteServingMutation = useDeleteServing();

  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden]),
  );

  const [saving, setSaving] = useState(false);
  const [addingServing, setAddingServing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [variant, setVariant] = useState("");
  const [brand, setBrand] = useState("");
  const [servings, setServings] = useState<Serving[]>([]);
  const [defaultServingId, setDefaultServingId] = useState<string | null>(null);
  const [originalDefaultServingId, setOriginalDefaultServingId] = useState<string | null>(null);

  const [menuServingId, setMenuServingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const foodQuery = useQuery({
    queryKey: queryKeys.catalog.food(id),
    queryFn: () => apiFetch<Food>(`/catalog/foods/${id}`),
    enabled: !!id,
  });

  const usageQuery = useQuery({
    queryKey: queryKeys.catalog.servingUsage(confirmDeleteId ?? ""),
    queryFn: () =>
      apiFetch<{ mealItemCount: number }>(`/catalog/servings/${confirmDeleteId}/usage`),
    enabled: !!confirmDeleteId,
  });

  // Populate form when food data first loads (not on background refetches)
  useEffect(() => {
    if (!foodQuery.data) return;
    const food = foodQuery.data;
    setName(food.name);
    setVariant(food.variant ?? "");
    setBrand(food.brand ?? "");
    setServings(food.servings);
    const def = food.servings.find((s) => s.isDefault);
    setDefaultServingId(def?.id ?? null);
    setOriginalDefaultServingId(def?.id ?? null);
  }, [foodQuery.data?.id]); // eslint-disable-line

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateFoodMutation.mutateAsync({
        id,
        data: {
          name: name.trim(),
          variant: variant.trim() || undefined,
          brand: brand.trim() || undefined,
        },
      });

      if (defaultServingId && defaultServingId !== originalDefaultServingId) {
        await updateServingMutation.mutateAsync({
          id: defaultServingId,
          foodId: id,
          data: { isDefault: true },
        });
      }

      router.replace(`/catalog/foods/${id}?edited=true`);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddServing() {
    setAddingServing(true);
    try {
      const newServing = await apiFetch<{ id: string }>(`/catalog/servings`, {
        method: "POST",
        body: { foodId: id, size: 100, unit: "g" },
      });
      router.push(`/catalog/servings/${newServing.id}?isNew=true`);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Failed to add serving");
    } finally {
      setAddingServing(false);
    }
  }

  async function handleDeleteServing(servingId: string) {
    setConfirmDeleteId(null);
    setDeletingId(servingId);
    try {
      await deleteServingMutation.mutateAsync(
        { id: servingId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.catalog.food(id) });
          },
        }
      );
      setServings((prev) => prev.filter((s) => s.id !== servingId));
      if (defaultServingId === servingId) setDefaultServingId(null);
      if (originalDefaultServingId === servingId) setOriginalDefaultServingId(null);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Failed to delete serving");
    } finally {
      setDeletingId(null);
    }
  }

  const menuServing = servings.find((s) => s.id === menuServingId) ?? null;
  const confirmServing = servings.find((s) => s.id === confirmDeleteId) ?? null;
  const isValid = name.trim().length > 0;
  const usageCount = usageQuery.data?.mealItemCount ?? null;
  const usageLoading = usageQuery.isLoading;

  if (foodQuery.isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (foodQuery.error) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center px-6">
        <Text className="text-red-400 text-base">
          {foodQuery.error instanceof Error ? foodQuery.error.message : "Failed to load food"}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: name || "Edit Food" }} />
      {/* Serving action menu */}
      <Modal
        visible={!!menuServingId}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuServingId(null)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setMenuServingId(null)}
        >
          <Pressable onPress={() => {}}>
            <View className="bg-slate-900 rounded-t-2xl px-4 pt-4 pb-8">
              {menuServing && (
                <Text className="text-slate-400 text-xs mb-4 px-1" numberOfLines={1}>
                  {menuServing.name ?? `${menuServing.size}${menuServing.unit}`}
                </Text>
              )}
              <TouchableOpacity
                onPress={() => {
                  setMenuServingId(null);
                  router.push(`/catalog/servings/${menuServingId}`);
                }}
                className="flex-row items-center gap-3 px-1 py-3 border-b border-slate-800"
              >
                <Icon name="edit" size={18} color="#94a3b8" />
                <Text className="text-white text-base">Edit Serving</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (!menuServingId) return;
                  setConfirmDeleteId(menuServingId);
                  setMenuServingId(null);
                }}
                className="flex-row items-center gap-3 px-1 py-3"
              >
                <Icon name="trash" size={18} color="#f87171" />
                <Text className="text-red-400 text-base">Delete Serving</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={!!confirmDeleteId}
        title="Delete Serving?"
        message={
          usageLoading || usageCount === null
            ? undefined
            : usageCount > 0
            ? `"${confirmServing?.name ?? `${confirmServing?.size}${confirmServing?.unit}`}" has been logged ${usageCount} time${usageCount === 1 ? "" : "s"}. Those meal entries will also be deleted.`
            : `"${confirmServing?.name ?? `${confirmServing?.size}${confirmServing?.unit}`}" has no meal entries and will be permanently removed.`
        }
        confirmLabel="Delete"
        destructive
        loading={usageLoading}
        onConfirm={() => confirmDeleteId && handleDeleteServing(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <KeyboardAvoidingView
        className="flex-1 bg-slate-950"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
          <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-6">
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. McDonald's"
              placeholderTextColor="#475569"
              style={{ color: "white" }}
            />
          </View>

          {/* Default Serving */}
          {servings.length > 0 && (
            <>
              <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">Default Serving</Text>
              <View className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
                {servings.map((s, i) => {
                  const label = s.name ?? `${s.size}${s.unit}`;
                  const isSelected = defaultServingId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setDefaultServingId(s.id)}
                      className={`flex-row items-center justify-between px-4 py-3 ${
                        i > 0 ? "border-t border-slate-800" : ""
                      }`}
                    >
                      <Text className={isSelected ? "text-blue-400 font-medium" : "text-white"}>
                        {label}
                      </Text>
                      {isSelected && <Icon name="check" size={18} color="#3b82f6" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Servings */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-slate-400 text-xs uppercase tracking-wide">Servings</Text>
            <TouchableOpacity
              onPress={handleAddServing}
              disabled={addingServing}
              className="flex-row items-center gap-1"
            >
              {addingServing ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Icon name="plus" size={16} color="#3b82f6" />
              )}
              <Text className="text-blue-500 text-xs">Add Serving</Text>
            </TouchableOpacity>
          </View>

          {servings.length === 0 && (
            <Text className="text-slate-600 text-sm mb-4">No servings yet.</Text>
          )}

          {servings.map((s) => (
            <View
              key={s.id}
              className="flex-row items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-2"
            >
              <View className="flex-1 mr-2">
                <Text className="text-white text-sm">
                  {s.name ?? `${s.size}${s.unit}`}
                </Text>
                {s.name && (
                  <Text className="text-slate-500 text-xs mt-0.5">
                    {s.size}{s.unit}
                  </Text>
                )}
              </View>
              {deletingId === s.id ? (
                <ActivityIndicator size="small" color="#475569" />
              ) : (
                <TouchableOpacity
                  onPress={() => setMenuServingId(s.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="more-vertical" size={18} color="#475569" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {servings.length > 0 && <View className="mb-4" />}

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
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
