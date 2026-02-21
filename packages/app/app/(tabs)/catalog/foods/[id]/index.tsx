import { useState, useCallback, useEffect } from "react";
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Modal, Pressable } from "react-native";
import { ConfirmModal } from "../../../../../components/ConfirmModal";
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from "expo-router";
import { Icon, type IconName } from "../../../../../lib/icons";
import { ApiError, apiFetch } from "../../../../../lib/api";
import { FlashMessage } from "../../../../../components/FlashMessage";

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
  const { id, editedServingId, newServingId, edited } = useLocalSearchParams<{
    id: string;
    editedServingId?: string;
    newServingId?: string;
    edited?: string;
  }>();
  const router = useRouter();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showEditedFlash, setShowEditedFlash] = useState(false);
  const [showAddedFlash, setShowAddedFlash] = useState(false);
  const [menuServingId, setMenuServingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!editedServingId) return;
    setHighlightedId(editedServingId);
    const t = setTimeout(() => setHighlightedId(null), 3000);
    return () => clearTimeout(t);
  }, [editedServingId]);

  useEffect(() => {
    if (!newServingId) return;
    setHighlightedId(newServingId);
    setShowAddedFlash(true);
    const t1 = setTimeout(() => setHighlightedId(null), 3000);
    const t2 = setTimeout(() => setShowAddedFlash(false), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [newServingId]);

  useEffect(() => {
    if (!edited) return;
    setShowEditedFlash(true);
    const t = setTimeout(() => setShowEditedFlash(false), 3000);
    return () => clearTimeout(t);
  }, [edited]);

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

  useEffect(() => {
    if (!confirmDeleteId) { setUsageCount(null); return; }
    setUsageLoading(true);
    apiFetch<{ mealItemCount: number }>(`/catalog/servings/${confirmDeleteId}/usage`)
      .then((r) => setUsageCount(r.mealItemCount))
      .catch(() => setUsageCount(null))
      .finally(() => setUsageLoading(false));
  }, [confirmDeleteId]);

  async function handleDeleteServing(servingId: string) {
    setConfirmDeleteId(null);
    setDeletingId(servingId);
    try {
      await apiFetch(`/catalog/servings/${servingId}`, { method: "DELETE" });
      setFood((prev) =>
        prev ? { ...prev, servings: prev.servings.filter((s) => s.id !== servingId) } : prev
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete serving");
    } finally {
      setDeletingId(null);
    }
  }

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
  const menuServing = food.servings.find((s) => s.id === menuServingId) ?? null;
  const confirmServing = food.servings.find((s) => s.id === confirmDeleteId) ?? null;

  return (
    <>
      <Stack.Screen
        options={{
          title: displayName,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/catalog/foods/${id}/edit`)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="edit" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ),
        }}
      />

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

      <ScrollView className="flex-1 bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="text-white text-2xl font-bold">{displayName}</Text>
        {food.brand && (
          <Text className="text-slate-400 text-sm mt-1 mb-4">{food.brand}</Text>
        )}

        <FlashMessage visible={showEditedFlash} message="Food updated" />
        <FlashMessage visible={showAddedFlash} message="Serving added" />
        <FlashMessage visible={!!highlightedId && !showAddedFlash} message="Serving updated" />

        <View className="flex-row items-center justify-between mb-3 mt-2">
          <Text className="text-slate-400 text-xs uppercase tracking-wide">
            Servings
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/catalog/foods/${id}/servings/new`)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="plus" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

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
                      <Icon name="alert-circle" size={11} color="#f59e0b" />
                      <Text className="text-amber-500 text-xs">{STATUS_LABEL[serving.status]}</Text>
                    </View>
                  )}
                  {deletingId === serving.id ? (
                    <ActivityIndicator size="small" color="#475569" />
                  ) : (
                    <TouchableOpacity
                      onPress={() => setMenuServingId(serving.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="more-vertical" size={18} color="#475569" />
                    </TouchableOpacity>
                  )}
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
    </>
  );
}
