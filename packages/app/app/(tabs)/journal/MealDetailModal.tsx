import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Icon, type IconName } from "../../../lib/icons";
import { type Meal, type MealItem, deleteMealItem } from "../../../lib/nutrition";

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

  // Sync local items when modal opens or meal changes
  useEffect(() => {
    if (visible && meal) {
      setLocalItems(meal.items);
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
            <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
              {localItems.map((item, index) => {
                const foodName = [item.food.name, item.food.variant]
                  .filter(Boolean)
                  .join(" · ");
                const totalServing = +(item.quantity * item.serving.size).toFixed(1);
                const servingLabel = `${totalServing}${item.serving.unit}`;
                const isDeleting = deletingItemId === item.id;

                return (
                  <View
                    key={item.id}
                    className={`py-3 ${index > 0 ? "border-t border-slate-800" : ""}`}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-1.5">
                          {item.isEstimated && (
                            <Icon
                              name="alert-circle"
                              size={13}
                              color="#f59e0b"
                            />
                          )}
                          <Text
                            className="text-white text-sm font-medium flex-shrink"
                            numberOfLines={2}
                          >
                            {foodName}
                          </Text>
                        </View>
                        <Text className="text-slate-500 text-xs mt-0.5">
                          {servingLabel}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteItem(item.id)}
                        disabled={!!deletingItemId}
                        className="p-1 mt-0.5"
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color="#64748b" />
                        ) : (
                          <Icon name="trash" size={18} color="#64748b" />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Nutrition breakdown */}
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
      </View>
    </Modal>
  );
}
