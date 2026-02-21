import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Icon } from "../../../lib/icons";
import { useDebounce } from "@uidotdev/usehooks";
import { apiFetch } from "../../../lib/api";
import {
  quickAdd,
  logMealItem,
  createMealWithItem,
  type DailySummary,
} from "../../../lib/nutrition";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

const MEAL_TYPE_ORDER: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];
const MEAL_TYPE_LABEL: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getFullDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAY_SHORT[date.getDay()]}, ${MONTH_SHORT[m - 1]} ${d}, ${y}`;
}

function getRelativeDate(dateStr: string): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (dateStr === toDateString(today)) return "Today";
  if (dateStr === toDateString(yesterday)) return "Yesterday";
  const [, m, d] = dateStr.split("-").map(Number);
  return `${MONTH_SHORT[m - 1]} ${d}`;
}

interface SearchFood {
  id: string;
  name: string;
  variant: string | null;
  brand: string | null;
}

interface FullServing {
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

interface FullFood {
  id: string;
  name: string;
  variant: string | null;
  servings: FullServing[];
}

function servingOptionLabel(s: FullServing): string {
  if (s.name) return `${s.name} (${s.size}${s.unit})`;
  return `${s.size}${s.unit}`;
}

type Phase = "search" | "configure";

type QuickAddModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  date: string;
  defaultMealType?: MealType;
  summary: DailySummary | null;
};

const MAX_HEIGHT = Dimensions.get("window").height * 0.85;

export function QuickAddModal({
  visible,
  onClose,
  onSuccess,
  date,
  defaultMealType,
  summary,
}: QuickAddModalProps) {
  const [phase, setPhase] = useState<Phase>("search");

  // Search
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [searchResults, setSearchResults] = useState<SearchFood[]>([]);
  const [searching, setSearching] = useState(false);

  // Selection
  const [isNewFood, setIsNewFood] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FullFood | null>(null);
  const [loadingFood, setLoadingFood] = useState(false);

  // Configure — meal type
  const [mealType, setMealType] = useState<MealType | undefined>(defaultMealType);
  const [mealTypeOpen, setMealTypeOpen] = useState(false);

  // Configure — new food fields
  const [servingSizeStr, setServingSizeStr] = useState("100");
  const [servingUnit, setServingUnit] = useState("g");

  // Configure — existing food fields
  const [selectedServing, setSelectedServing] = useState<FullServing | null>(null);
  const [servingPickerOpen, setServingPickerOpen] = useState(false);
  const [quantityStr, setQuantityStr] = useState("1");
  const [totalStr, setTotalStr] = useState("");

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived validation
  const servingSize = parseFloat(servingSizeStr);
  const quantity = parseFloat(quantityStr);
  const isFormValid = isNewFood
    ? !!mealType && !isNaN(servingSize) && servingSize > 0 && servingUnit.trim().length > 0
    : !!mealType && !!selectedServing && !isNaN(quantity) && quantity > 0;

  // Reset on open
  useEffect(() => {
    if (visible) {
      setPhase("search");
      setQuery("");
      setSearchResults([]);
      setIsNewFood(false);
      setSelectedFood(null);
      setMealType(defaultMealType);
      setMealTypeOpen(false);
      setServingSizeStr("100");
      setServingUnit("g");
      setSelectedServing(null);
      setServingPickerOpen(false);
      setQuantityStr("1");
      setTotalStr("");
      setError(null);
    }
  }, [visible, defaultMealType]);

  // Search
  useEffect(() => {
    if (!visible || debouncedQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    apiFetch<SearchFood[]>(
      `/catalog/foods/search?q=${encodeURIComponent(debouncedQuery.trim())}`
    )
      .then(setSearchResults)
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, [debouncedQuery, visible]);

  const handleSelectExistingFood = useCallback(async (food: SearchFood) => {
    setLoadingFood(true);
    setError(null);
    try {
      const fullFood = await apiFetch<FullFood>(`/catalog/foods/${food.id}`);
      if (!fullFood.servings.length) {
        setError("No servings found for this food");
        return;
      }
      const defaultServing =
        fullFood.servings.find((s) => s.isDefault) ?? fullFood.servings[0];
      setSelectedFood(fullFood);
      setSelectedServing(defaultServing);
      setQuantityStr("1");
      setTotalStr(String(defaultServing.size));
      setIsNewFood(false);
      setPhase("configure");
    } catch {
      setError("Failed to load food details");
    } finally {
      setLoadingFood(false);
    }
  }, []);

  const handleSelectQuickAdd = useCallback(() => {
    setIsNewFood(true);
    setSelectedFood(null);
    setSelectedServing(null);
    setServingSizeStr("100");
    setServingUnit("g");
    setPhase("configure");
  }, []);

  const handleQuantityChange = useCallback((val: string) => {
    setQuantityStr(val);
    if (!val.endsWith(".")) {
      const qty = parseFloat(val);
      if (selectedServing && !isNaN(qty) && qty > 0) {
        setTotalStr(String(+(selectedServing.size * qty).toFixed(1)));
      }
    }
  }, [selectedServing]);

  const handleTotalChange = useCallback((val: string) => {
    setTotalStr(val);
    if (!val.endsWith(".")) {
      const total = parseFloat(val);
      if (selectedServing && !isNaN(total) && total > 0 && selectedServing.size > 0) {
        setQuantityStr(String(+(total / selectedServing.size).toFixed(2)));
      }
    }
  }, [selectedServing]);

  async function handleSubmit() {
    if (!isFormValid || !mealType) return;

    setSubmitting(true);
    setError(null);
    try {
      if (isNewFood) {
        await quickAdd({
          food: { name: query.trim() },
          servingSize,
          servingUnit: servingUnit.trim(),
          quantity: 1,
          mealType,
          date,
        });
      } else {
        const serving = selectedServing!;
        const existingMeal = summary?.meals.find((m) => m.mealType === mealType);
        if (existingMeal) {
          await logMealItem({
            mealId: existingMeal.id,
            foodId: selectedFood!.id,
            servingId: serving.id,
            quantity,
          });
        } else {
          await createMealWithItem({
            date,
            mealType,
            foodId: selectedFood!.id,
            servingId: serving.id,
            quantity,
          });
        }
      }
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to log food");
    } finally {
      setSubmitting(false);
    }
  }

  const foodLabel = selectedFood
    ? [selectedFood.name, selectedFood.variant].filter(Boolean).join(" · ")
    : query.trim();

  const relativeDate = getRelativeDate(date);
  const fullDate = getFullDate(date);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            className="bg-slate-900 rounded-t-3xl border-t border-slate-800"
            style={{ maxHeight: MAX_HEIGHT }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
              <View className="flex-row items-center gap-3 flex-1">
                {phase === "configure" && (
                  <TouchableOpacity onPress={() => setPhase("search")}>
                    <Icon name="arrow-left" size={22} color="#94a3b8" />
                  </TouchableOpacity>
                )}
                <View>
                  <Text className="text-white text-xl font-bold">Quick Log</Text>
                  <Text className="text-slate-500 text-xs mt-0.5">{fullDate}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Icon name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {phase === "search" ? (
              <View className="px-6 pb-8">
                {/* Search input */}
                <View className="bg-slate-800 rounded-xl border border-slate-700 px-4 py-3 flex-row items-center gap-2 mb-4">
                  <Icon name="search" size={16} color="#64748b" />
                  <TextInput
                    autoFocus
                    placeholder="Search or type a food name..."
                    placeholderTextColor="#64748b"
                    className="flex-1 text-white text-base"
                    value={query}
                    onChangeText={setQuery}
                    returnKeyType="search"
                  />
                  {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery("")}>
                      <Icon name="close-circle" size={16} color="#64748b" />
                    </TouchableOpacity>
                  )}
                </View>

                {searching && (
                  <ActivityIndicator color="#3b82f6" className="my-4" />
                )}

                {/* Quick-add action */}
                {query.trim().length > 0 && !searching && (
                  <TouchableOpacity
                    onPress={handleSelectQuickAdd}
                    className="flex-row items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-3"
                  >
                    <Icon name="plus-circle" size={20} color="#3b82f6" />
                    <Text className="text-blue-400 text-base flex-1" numberOfLines={1}>
                      Quick-add "{query.trim()}"
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Search results */}
                {searchResults.length > 0 && (
                  <ScrollView
                    style={{ maxHeight: 300 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {searchResults.map((food) => {
                      const displayName = [food.name, food.variant]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <TouchableOpacity
                          key={food.id}
                          onPress={() => handleSelectExistingFood(food)}
                          disabled={loadingFood}
                          className="flex-row items-center justify-between py-3 border-b border-slate-800"
                        >
                          <View className="flex-1 mr-2">
                            <Text className="text-white text-sm font-medium" numberOfLines={1}>
                              {displayName}
                            </Text>
                            {food.brand && (
                              <Text className="text-slate-500 text-xs mt-0.5">{food.brand}</Text>
                            )}
                          </View>
                          <Icon name="chevron-right" size={16} color="#475569" />
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {!searching && query.trim().length === 0 && (
                  <Text className="text-slate-600 text-sm text-center mt-4">
                    Search your food catalog, or type a name to quick-add.
                  </Text>
                )}

                {loadingFood && (
                  <View className="absolute inset-0 items-center justify-center rounded-t-3xl bg-slate-900/80">
                    <ActivityIndicator color="#3b82f6" />
                  </View>
                )}

                {error && (
                  <View className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mt-3">
                    <Text className="text-red-400 text-sm">{error}</Text>
                  </View>
                )}
              </View>
            ) : (
              <ScrollView
                className="px-6"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Food label */}
                <Text className="text-white text-lg font-semibold mb-1" numberOfLines={1}>
                  {isNewFood ? `New: ${foodLabel}` : foodLabel}
                </Text>
                {isNewFood && (
                  <View className="flex-row items-center gap-1 mb-4">
                    <Icon name="alert-circle" size={12} color="#f59e0b" />
                    <Text className="text-amber-500 text-xs">
                      Nutrition will be estimated — review later
                    </Text>
                  </View>
                )}

                {/* Meal type dropdown */}
                <Text className="text-slate-400 text-sm mb-2 mt-3">
                  Meal Type<Text className="text-rose-500"> *</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setMealTypeOpen((v) => !v)}
                  className="flex-row items-center justify-between px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 mb-1"
                >
                  <Text className={mealType ? "text-white text-base" : "text-slate-500 text-base"}>
                    {mealType ? MEAL_TYPE_LABEL[mealType] : "Select meal type"}
                  </Text>
                  <Icon
                    name={mealTypeOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#64748b"
                  />
                </TouchableOpacity>

                {mealTypeOpen && (
                  <View className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-4">
                    {MEAL_TYPE_ORDER.map((type, i) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => { setMealType(type); setMealTypeOpen(false); }}
                        className={`flex-row items-center justify-between px-4 py-3 ${
                          i > 0 ? "border-t border-slate-700" : ""
                        }`}
                      >
                        <Text
                          className={
                            mealType === type
                              ? "text-blue-400 font-medium text-base"
                              : "text-white text-base"
                          }
                        >
                          {MEAL_TYPE_LABEL[type]}
                        </Text>
                        {mealType === type && (
                          <Icon name="check" size={18} color="#3b82f6" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {!mealTypeOpen && <View className="mb-4" />}

                {/* Serving section */}
                <Text className="text-slate-400 text-sm mb-2">Serving</Text>

                {isNewFood ? (
                  /* New food: editable size + unit */
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-[2]">
                      <Text className="text-slate-500 text-xs mb-1">Size</Text>
                      <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                        <TextInput
                          value={servingSizeStr}
                          onChangeText={setServingSizeStr}
                          keyboardType="decimal-pad"
                          style={{ color: "white", flex: 1, paddingHorizontal: 12, paddingVertical: 12 }}
                        />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-500 text-xs mb-1">Unit</Text>
                      <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                        <TextInput
                          value={servingUnit}
                          onChangeText={setServingUnit}
                          autoCapitalize="none"
                          autoCorrect={false}
                          placeholder="g"
                          placeholderTextColor="#475569"
                          style={{ color: "white", flex: 1, paddingHorizontal: 12, paddingVertical: 12 }}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  /* Existing food: serving picker + multiplier */
                  <>
                    <Text className="text-slate-500 text-xs mb-1">
                      Which serving
                    </Text>
                    <TouchableOpacity
                      onPress={() => setServingPickerOpen((v) => !v)}
                      className="flex-row items-center justify-between px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 mb-1"
                    >
                      <Text className={selectedServing ? "text-white text-base" : "text-slate-500 text-base"}>
                        {selectedServing
                          ? servingOptionLabel(selectedServing)
                          : "Select serving"}
                      </Text>
                      <Icon
                        name={servingPickerOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color="#64748b"
                      />
                    </TouchableOpacity>

                    {servingPickerOpen && selectedFood && (
                      <View className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-3">
                        {selectedFood.servings.map((s, i) => (
                          <TouchableOpacity
                            key={s.id}
                            onPress={() => { setSelectedServing(s); setServingPickerOpen(false); setQuantityStr("1"); setTotalStr(String(s.size)); }}
                            className={`flex-row items-center justify-between px-4 py-3 ${
                              i > 0 ? "border-t border-slate-700" : ""
                            }`}
                          >
                            <Text
                              className={
                                selectedServing?.id === s.id
                                  ? "text-blue-400 font-medium text-base"
                                  : "text-white text-base"
                              }
                            >
                              {servingOptionLabel(s)}
                            </Text>
                            {selectedServing?.id === s.id && (
                              <Icon name="check" size={18} color="#3b82f6" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {!servingPickerOpen && <View className="mb-3" />}

                    {/* Row 1: Per serving + Quantity */}
                    <View className="flex-row gap-3 mb-3">
                      {/* Per serving (readonly) */}
                      <View className="flex-[2]">
                        <Text className="text-slate-500 text-xs mb-1">Per serving</Text>
                        <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                          <Text
                            style={{ color: "#94a3b8", flex: 1, paddingHorizontal: 12, paddingVertical: 12 }}
                            numberOfLines={1}
                          >
                            {selectedServing?.size ?? "—"}
                          </Text>
                          <View
                            style={{
                              borderLeftWidth: 1,
                              borderLeftColor: "#334155",
                              paddingHorizontal: 12,
                              paddingVertical: 12,
                            }}
                          >
                            <Text style={{ color: "#94a3b8", fontSize: 14 }}>
                              {selectedServing?.unit ?? ""}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {/* Quantity */}
                      <View className="flex-1">
                        <Text className="text-slate-500 text-xs mb-1">Quantity</Text>
                        <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-3">
                          <Text className="text-slate-400 text-sm mr-1">×</Text>
                          <TextInput
                            value={quantityStr}
                            onChangeText={handleQuantityChange}
                            keyboardType="decimal-pad"
                            style={{ color: "white", flex: 1 }}
                          />
                        </View>
                      </View>
                    </View>
                    {/* Row 2: Total (editable, full width) */}
                    <View className="mb-4">
                      <Text className="text-slate-500 text-xs mb-1">Total</Text>
                      <View className="flex-row items-center bg-slate-800 border border-blue-500/40 rounded-xl px-3 py-3">
                        <TextInput
                          value={totalStr}
                          onChangeText={handleTotalChange}
                          keyboardType="decimal-pad"
                          style={{ color: "white", flex: 1, fontSize: 15 }}
                        />
                        {selectedServing?.unit ? (
                          <Text style={{ color: "#94a3b8", fontSize: 14, marginLeft: 4 }}>
                            {selectedServing.unit}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </>
                )}

                {/* Nutrition preview (existing food only) */}
                {!isNewFood && selectedServing?.calories != null && (() => {
                  const qty = parseFloat(quantityStr);
                  if (isNaN(qty) || qty <= 0) return null;
                  return (
                    <View className="bg-slate-800 rounded-xl px-4 py-3 mb-4 border border-slate-700">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-white text-sm font-medium">
                          {Math.round((selectedServing.calories ?? 0) * qty)} kcal
                        </Text>
                        <View className="flex-row gap-3">
                          {selectedServing.protein != null && (
                            <Text className="text-blue-400 text-xs">
                              P {Math.round(selectedServing.protein * qty)}g
                            </Text>
                          )}
                          {selectedServing.carbs != null && (
                            <Text className="text-amber-400 text-xs">
                              C {Math.round(selectedServing.carbs * qty)}g
                            </Text>
                          )}
                          {selectedServing.fat != null && (
                            <Text className="text-rose-400 text-xs">
                              F {Math.round(selectedServing.fat * qty)}g
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {error && (
                  <View className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-4">
                    <Text className="text-red-400 text-sm">{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!isFormValid || submitting}
                  className={`py-4 rounded-xl items-center mb-8 ${
                    !isFormValid || submitting ? "bg-blue-500/30" : "bg-blue-500"
                  }`}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text
                      className={`font-semibold text-base ${
                        !isFormValid ? "text-slate-500" : "text-white"
                      }`}
                    >
                      Add to Journal · {relativeDate}
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
