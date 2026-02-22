import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Icon } from "@/lib/icons";
import { type Meal, type MealItem, deleteMealItem, updateMealItem } from "@/lib/nutrition";

const MEAL_TYPE_MAP = {
  BREAKFAST: { label: "Breakfast", icon: "meal-breakfast" as const },
  LUNCH: { label: "Lunch", icon: "meal-lunch" as const },
  DINNER: { label: "Dinner", icon: "meal-dinner" as const },
  SNACK: { label: "Snack", icon: "meal-snack" as const },
} as const;

type MealDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  meal: Meal | null;
  dateLabel: string;
  onItemDeleted: () => void;
};

export function MealDetailModal({
  visible,
  onClose,
  meal,
  dateLabel,
  onItemDeleted,
}: MealDetailModalProps) {
  const [localItems, setLocalItems] = useState<MealItem[]>([]);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuantityStr, setEditQuantityStr] = useState("");
  const [editTotalStr, setEditTotalStr] = useState("");
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && meal) {
      setLocalItems(meal.items);
      setEditingItemId(null);
      setEditError(null);
    }
  }, [visible, meal]);

  const mealTypeInfo = meal ? MEAL_TYPE_MAP[meal.mealType] : null;

  const localTotals = localItems.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.nutrition.calories ?? 0),
      protein: acc.protein + (item.nutrition.protein ?? 0),
      carbs: acc.carbs + (item.nutrition.carbs ?? 0),
      fat: acc.fat + (item.nutrition.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const startEditing = useCallback((item: MealItem) => {
    setEditingItemId(item.id);
    setEditQuantityStr(String(item.quantity));
    setEditTotalStr(String(+(item.quantity * item.serving.size).toFixed(1)));
    setEditError(null);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingItemId(null);
    setEditError(null);
  }, []);

  const handleQuantityChange = useCallback((val: string, servingSize: number) => {
    setEditQuantityStr(val);
    if (!val.endsWith(".")) {
      const qty = parseFloat(val);
      if (!isNaN(qty) && qty > 0) {
        setEditTotalStr(String(+(servingSize * qty).toFixed(1)));
      }
    }
  }, []);

  const handleTotalChange = useCallback((val: string, servingSize: number) => {
    setEditTotalStr(val);
    if (!val.endsWith(".")) {
      const total = parseFloat(val);
      if (!isNaN(total) && total > 0 && servingSize > 0) {
        setEditQuantityStr(String(+(total / servingSize).toFixed(2)));
      }
    }
  }, []);

  async function handleSaveEdit(item: MealItem) {
    const qty = parseFloat(editQuantityStr);
    if (isNaN(qty) || qty <= 0) {
      setEditError("Enter a valid quantity");
      return;
    }
    setSavingItemId(item.id);
    setEditError(null);
    try {
      await updateMealItem(item.id, qty);
      setLocalItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity: qty,
                nutrition: {
                  calories: i.serving.calories != null ? i.serving.calories * qty : undefined,
                  protein: i.nutrition.protein != null ? (i.nutrition.protein / i.quantity) * qty : undefined,
                  carbs: i.nutrition.carbs != null ? (i.nutrition.carbs / i.quantity) * qty : undefined,
                  fat: i.nutrition.fat != null ? (i.nutrition.fat / i.quantity) * qty : undefined,
                },
              }
            : i,
        ),
      );
      setEditingItemId(null);
      onItemDeleted(); // triggers parent refresh
    } catch {
      setEditError("Failed to save. Please try again.");
    } finally {
      setSavingItemId(null);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (deletingItemId) return;
    setDeletingItemId(itemId);
    try {
      await deleteMealItem(itemId);
      const remaining = localItems.filter((item) => item.id !== itemId);
      setLocalItems(remaining);
      onItemDeleted();
      if (remaining.length === 0) {
        onClose();
      }
    } catch {
      // leave as-is on error
    } finally {
      setDeletingItemId(null);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View
            className="bg-slate-900 rounded-t-3xl border-t border-slate-800"
            style={{ maxHeight: "85%" }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
              <View className="flex-row items-center gap-2">
                {mealTypeInfo && (
                  <Icon name={mealTypeInfo.icon} size={20} color="#64748b" />
                )}
                <View>
                  <Text className="text-white text-xl font-bold">
                    {mealTypeInfo?.label ?? ""}
                  </Text>
                  <Text className="text-slate-500 text-xs mt-0.5">{dateLabel}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Icon name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {meal && (
              <ScrollView
                className="px-6"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {localItems.map((item, index) => {
                  const foodName = [item.food.name, item.food.variant]
                    .filter(Boolean)
                    .join(" · ");
                  const totalServing = +(item.quantity * item.serving.size).toFixed(1);
                  const servingLabel = `${totalServing}${item.serving.unit}`;
                  const isDeleting = deletingItemId === item.id;
                  const isEditing = editingItemId === item.id;
                  const isSaving = savingItemId === item.id;

                  return (
                    <View
                      key={item.id}
                      className={`py-3 ${index > 0 ? "border-t border-slate-800" : ""}`}
                    >
                      {/* Item header row */}
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 mr-3">
                          <View className="flex-row items-center gap-1.5">
                            {item.isEstimated && (
                              <Icon name="alert-circle" size={13} color="#f59e0b" />
                            )}
                            <Text
                              className="text-white text-sm font-medium flex-shrink"
                              numberOfLines={2}
                            >
                              {foodName}
                            </Text>
                          </View>
                          {!isEditing && (
                            <Text className="text-slate-500 text-xs mt-0.5">
                              {servingLabel}
                            </Text>
                          )}
                        </View>

                        {/* Action buttons */}
                        <View className="flex-row items-center gap-2 mt-0.5">
                          <TouchableOpacity
                            onPress={() => isEditing ? cancelEditing() : startEditing(item)}
                            disabled={!!deletingItemId || !!savingItemId}
                            className="p-1"
                          >
                            <Icon
                              name={isEditing ? "close-circle" : "edit"}
                              size={18}
                              color={isEditing ? "#64748b" : "#3b82f6"}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteItem(item.id)}
                            disabled={!!deletingItemId || !!savingItemId || isEditing}
                            className="p-1"
                          >
                            {isDeleting ? (
                              <ActivityIndicator size="small" color="#64748b" />
                            ) : (
                              <Icon
                                name="trash"
                                size={18}
                                color={isEditing ? "#334155" : "#64748b"}
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Inline edit form */}
                      {isEditing && (
                        <View className="mt-3">
                          <View className="flex-row gap-3 mb-2">
                            {/* Per serving (readonly) */}
                            <View className="flex-[2]">
                              <Text className="text-slate-500 text-xs mb-1">Per serving</Text>
                              <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                                <Text
                                  style={{ color: "#94a3b8", flex: 1, paddingHorizontal: 12, paddingVertical: 10 }}
                                  numberOfLines={1}
                                >
                                  {item.serving.size}
                                </Text>
                                <View style={{ borderLeftWidth: 1, borderLeftColor: "#334155", paddingHorizontal: 12, paddingVertical: 10 }}>
                                  <Text style={{ color: "#94a3b8", fontSize: 14 }}>
                                    {item.serving.unit}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            {/* Quantity */}
                            <View className="flex-1">
                              <Text className="text-slate-500 text-xs mb-1">Quantity</Text>
                              <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5">
                                <Text className="text-slate-400 text-sm mr-1">×</Text>
                                <TextInput
                                  value={editQuantityStr}
                                  onChangeText={(v) => handleQuantityChange(v, item.serving.size)}
                                  keyboardType="decimal-pad"
                                  style={{ color: "white", flex: 1 }}
                                />
                              </View>
                            </View>
                          </View>

                          {/* Total */}
                          <View className="mb-2">
                            <Text className="text-slate-500 text-xs mb-1">Total</Text>
                            <View className="flex-row items-center bg-slate-800 border border-blue-500/40 rounded-xl px-3 py-2.5">
                              <TextInput
                                value={editTotalStr}
                                onChangeText={(v) => handleTotalChange(v, item.serving.size)}
                                keyboardType="decimal-pad"
                                style={{ color: "white", flex: 1, fontSize: 15 }}
                              />
                              <Text style={{ color: "#94a3b8", fontSize: 14, marginLeft: 4 }}>
                                {item.serving.unit}
                              </Text>
                            </View>
                          </View>

                          {/* Nutrition preview */}
                          {item.serving.calories != null && (() => {
                            const qty = parseFloat(editQuantityStr);
                            if (isNaN(qty) || qty <= 0) return null;
                            const perUnit = item.serving.calories;
                            const pPerUnit = item.nutrition.protein != null ? item.nutrition.protein / item.quantity : null;
                            const cPerUnit = item.nutrition.carbs != null ? item.nutrition.carbs / item.quantity : null;
                            const fPerUnit = item.nutrition.fat != null ? item.nutrition.fat / item.quantity : null;
                            return (
                              <View className="bg-slate-800 rounded-xl px-4 py-3 mb-2 border border-slate-700">
                                <View className="flex-row items-center justify-between">
                                  <Text className="text-white text-sm font-medium">
                                    {Math.round(perUnit * qty)} kcal
                                  </Text>
                                  <View className="flex-row gap-3">
                                    {pPerUnit != null && <Text className="text-blue-400 text-xs">P {Math.round(pPerUnit * qty)}g</Text>}
                                    {cPerUnit != null && <Text className="text-amber-400 text-xs">C {Math.round(cPerUnit * qty)}g</Text>}
                                    {fPerUnit != null && <Text className="text-rose-400 text-xs">F {Math.round(fPerUnit * qty)}g</Text>}
                                  </View>
                                </View>
                              </View>
                            );
                          })()}

                          {editError && (
                            <Text className="text-red-400 text-xs mb-2">{editError}</Text>
                          )}

                          <TouchableOpacity
                            onPress={() => handleSaveEdit(item)}
                            disabled={isSaving}
                            className="bg-blue-500 rounded-xl py-2.5 items-center disabled:opacity-50"
                          >
                            {isSaving ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <Text className="text-white font-semibold text-sm">Save</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Nutrition breakdown (when not editing) */}
                      {!isEditing && (
                        <View className="flex-row items-center gap-3 mt-2">
                          <Text className="text-white text-sm font-semibold">
                            {Math.round(item.nutrition.calories ?? 0)} kcal
                          </Text>
                          {item.nutrition.protein != null && (
                            <Text className="text-blue-400 text-xs">
                              P {Math.round(item.nutrition.protein)}g
                            </Text>
                          )}
                          {item.nutrition.carbs != null && (
                            <Text className="text-amber-400 text-xs">
                              C {Math.round(item.nutrition.carbs)}g
                            </Text>
                          )}
                          {item.nutrition.fat != null && (
                            <Text className="text-rose-400 text-xs">
                              F {Math.round(item.nutrition.fat)}g
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Totals row */}
                <View className="border-t border-slate-700 py-4 mt-1 mb-8">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-400 text-sm font-medium">Total</Text>
                    <Text className="text-white text-sm font-bold">
                      {Math.round(localTotals.calories)} kcal
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3 mt-1 justify-end">
                    {localTotals.protein > 0 && (
                      <Text className="text-blue-400 text-xs">
                        P {Math.round(localTotals.protein)}g
                      </Text>
                    )}
                    {localTotals.carbs > 0 && (
                      <Text className="text-amber-400 text-xs">
                        C {Math.round(localTotals.carbs)}g
                      </Text>
                    )}
                    {localTotals.fat > 0 && (
                      <Text className="text-rose-400 text-xs">
                        F {Math.round(localTotals.fat)}g
                      </Text>
                    )}
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
