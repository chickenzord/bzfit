import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useDailySummary,
  useNutritionGoal,
  type NutritionGoal,
} from "../../../lib/nutrition";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function generateDays(center: Date, count: number): Date[] {
  const half = Math.floor(count / 2);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(center);
    d.setDate(center.getDate() - half + i);
    return d;
  });
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MEAL_TYPE_MAP = {
  BREAKFAST: { label: "Breakfast", icon: "sunny-outline" as const },
  LUNCH: { label: "Lunch", icon: "partly-sunny-outline" as const },
  DINNER: { label: "Dinner", icon: "moon-outline" as const },
  SNACK: { label: "Snack", icon: "cafe-outline" as const },
} as const;

const MEAL_TYPE_ORDER = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

const ITEM_WIDTH = 48;

type GoalsModalProps = {
  visible: boolean;
  onClose: () => void;
};

function GoalsModal({ visible, onClose }: GoalsModalProps) {
  const { goal, loading, save } = useNutritionGoal();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  useEffect(() => {
    if (goal) {
      setForm({
        calories: goal.caloriesTarget?.toString() ?? "",
        protein: goal.proteinTarget?.toString() ?? "",
        carbs: goal.carbsTarget?.toString() ?? "",
        fat: goal.fatTarget?.toString() ?? "",
      });
    }
  }, [goal]);

  const handleClose = useCallback(() => {
    setEditing(false);
    onClose();
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({
        caloriesTarget: form.calories ? Number(form.calories) : null,
        proteinTarget: form.protein ? Number(form.protein) : null,
        carbsTarget: form.carbs ? Number(form.carbs) : null,
        fatTarget: form.fat ? Number(form.fat) : null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const goalRows: { key: keyof NutritionGoal; label: string; unit: string; color: string }[] = [
    { key: "caloriesTarget", label: "Calories", unit: "kcal", color: "text-white" },
    { key: "proteinTarget", label: "Protein", unit: "g", color: "text-blue-400" },
    { key: "carbsTarget", label: "Carbs", unit: "g", color: "text-amber-400" },
    { key: "fatTarget", label: "Fat", unit: "g", color: "text-rose-400" },
  ];

  const formFields: { key: keyof typeof form; label: string; unit: string }[] = [
    { key: "calories", label: "Calories", unit: "kcal" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "carbs", label: "Carbs", unit: "g" },
    { key: "fat", label: "Fat", unit: "g" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="bg-slate-900 rounded-t-3xl p-6 border-t border-slate-800">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">
                Nutrition Goals
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color="#3b82f6" className="my-8" />
            ) : editing ? (
              <>
                {formFields.map(({ key, label, unit }) => (
                  <View
                    key={key}
                    className="flex-row items-center justify-between mb-4"
                  >
                    <Text className="text-slate-400 text-sm">{label}</Text>
                    <View className="flex-row items-center gap-2">
                      <TextInput
                        value={form[key]}
                        onChangeText={(v) =>
                          setForm((f) => ({ ...f, [key]: v }))
                        }
                        keyboardType="numeric"
                        placeholder="—"
                        placeholderTextColor="#475569"
                        style={{ color: "white", textAlign: "right", minWidth: 64 }}
                      />
                      <Text className="text-slate-500 text-sm w-8">{unit}</Text>
                    </View>
                  </View>
                ))}
                <View className="flex-row gap-3 mt-2">
                  <TouchableOpacity
                    onPress={() => setEditing(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-700 items-center"
                  >
                    <Text className="text-slate-400">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-blue-500 items-center"
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-semibold">Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {!goal && (
                  <Text className="text-slate-500 text-sm mb-4">
                    No goals set yet. Tap "Edit Goals" to add your daily targets.
                  </Text>
                )}
                {goalRows.map(({ key, label, unit, color }) => {
                  const value = goal ? (goal[key] as number | null) : null;
                  return (
                    <View
                      key={key}
                      className="flex-row items-center justify-between mb-4"
                    >
                      <Text className="text-slate-400 text-sm">{label}</Text>
                      <Text className={`text-lg font-semibold ${color}`}>
                        {value != null ? `${value} ${unit}` : "—"}
                      </Text>
                    </View>
                  );
                })}
                <TouchableOpacity
                  onPress={() => setEditing(true)}
                  className="mt-2 py-3 rounded-xl border border-slate-700 items-center"
                >
                  <Text className="text-slate-300">Edit Goals</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function JournalScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [expanded, setExpanded] = useState(false);
  const [gridMonth, setGridMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [goalsVisible, setGoalsVisible] = useState(false);

  const days = generateDays(today, 91); // 45 days each side
  const flatListRef = useRef<FlatList<Date>>(null);

  useEffect(() => {
    const todayIdx = days.findIndex((d) => isSameDay(d, today));
    if (flatListRef.current && todayIdx >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: todayIdx,
          viewPosition: 0.5,
          animated: false,
        });
      }, 50);
    }
  }, []);

  const dateStr = toDateString(selectedDate);
  const { data: summary, loading } = useDailySummary(dateStr);

  const totals = summary?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const goals = summary?.goals;
  const caloriesTarget = goals?.calories?.target ?? null;
  const caloriesPercent = Math.min(goals?.calories?.percentage ?? 0, 100);

  function selectDate(date: Date) {
    setSelectedDate(date);
    setGridMonth({ year: date.getFullYear(), month: date.getMonth() });
  }

  function shiftGridMonth(delta: number) {
    setGridMonth(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const gridCells = getMonthGrid(gridMonth.year, gridMonth.month);

  const selectedLabel = `${DAY_SHORT[selectedDate.getDay()]}, ${MONTH_SHORT[selectedDate.getMonth()]} ${selectedDate.getDate()}`;

  return (
    <ScrollView className="flex-1 bg-slate-950" stickyHeaderIndices={[0]}>
      {/* Sticky header: branding + calendar */}
      <View className="bg-slate-950 pt-14 pb-3 border-b border-slate-800">
        {/* Branding row */}
        <View className="flex-row items-center justify-between px-4 mb-4">
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 bg-blue-500 rounded-lg items-center justify-center">
              <Ionicons name="flame" size={16} color="white" />
            </View>
            <Text className="text-white text-xl font-bold tracking-tight">
              BzFit
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setGoalsVisible(true)}>
              <Ionicons name="flag-outline" size={24} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="add-circle-outline" size={28} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Month label + expand toggle */}
        <View className="flex-row items-center justify-between px-4 mb-2">
          {expanded ? (
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => shiftGridMonth(-1)}>
                <Ionicons name="chevron-back" size={18} color="#94a3b8" />
              </TouchableOpacity>
              <Text className="text-white font-semibold text-base">
                {MONTH_NAMES[gridMonth.month]} {gridMonth.year}
              </Text>
              <TouchableOpacity onPress={() => shiftGridMonth(1)}>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          ) : (
            <Text className="text-slate-400 text-sm">
              {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => setExpanded((v) => !v)}
            className="flex-row items-center gap-1 py-1 px-2"
          >
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color="#64748b"
            />
          </TouchableOpacity>
        </View>

        {/* Collapsed: horizontal scroll */}
        {!expanded && (
          <FlatList
            ref={flatListRef}
            data={days}
            horizontal
            keyExtractor={(d) => d.toISOString()}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
            contentContainerStyle={{ paddingHorizontal: 8 }}
            renderItem={({ item }) => {
              const isSelected = isSameDay(item, selectedDate);
              const isToday = isSameDay(item, today);
              return (
                <TouchableOpacity
                  onPress={() => selectDate(item)}
                  style={{ width: ITEM_WIDTH }}
                  className={`items-center py-2 mx-0.5 rounded-xl ${isSelected ? "bg-blue-500" : ""}`}
                >
                  <Text
                    className={`text-xs ${isSelected ? "text-blue-100" : "text-slate-500"}`}
                  >
                    {DAY_SHORT[item.getDay()]}
                  </Text>
                  <Text
                    className={`text-base font-semibold mt-0.5 ${
                      isSelected
                        ? "text-white"
                        : isToday
                        ? "text-blue-400"
                        : "text-white"
                    }`}
                  >
                    {item.getDate()}
                  </Text>
                  {isToday && !isSelected && (
                    <View className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Expanded: monthly grid */}
        {expanded && (
          <View className="px-4">
            {/* Day-of-week header */}
            <View className="flex-row mb-1">
              {DAY_SHORT.map((d) => (
                <Text
                  key={d}
                  className="flex-1 text-center text-xs text-slate-500 font-medium"
                >
                  {d}
                </Text>
              ))}
            </View>
            {/* Grid cells */}
            {Array.from(
              { length: gridCells.length / 7 },
              (_, row) => gridCells.slice(row * 7, row * 7 + 7)
            ).map((week, ri) => (
              <View key={ri} className="flex-row mb-1">
                {week.map((date, ci) =>
                  date ? (
                    <TouchableOpacity
                      key={ci}
                      onPress={() => {
                        selectDate(date);
                        setExpanded(false);
                      }}
                      className={`flex-1 items-center py-1.5 mx-0.5 rounded-lg ${
                        isSameDay(date, selectedDate) ? "bg-blue-500" : ""
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          isSameDay(date, selectedDate)
                            ? "text-white"
                            : isSameDay(date, today)
                            ? "text-blue-400"
                            : "text-white"
                        }`}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View key={ci} className="flex-1" />
                  )
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Daily content */}
      <View className="px-4 pt-4 pb-10">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-slate-400 text-sm">{selectedLabel}</Text>
          {loading && <ActivityIndicator size="small" color="#3b82f6" />}
        </View>

        {/* Calories card — tappable to open goals */}
        <TouchableOpacity
          onPress={() => setGoalsVisible(true)}
          className="bg-slate-900 rounded-2xl p-5 mb-4 border border-slate-800 active:opacity-70"
        >
          <Text className="text-slate-400 text-sm mb-2">Calories</Text>
          <View className="flex-row items-end gap-2">
            <Text className="text-white text-4xl font-bold">
              {Math.round(totals.calories)}
            </Text>
            <Text className="text-slate-500 text-lg mb-1">
              {caloriesTarget != null
                ? `/ ${caloriesTarget.toLocaleString()} kcal`
                : "kcal"}
            </Text>
          </View>
          <View className="h-2 bg-slate-800 rounded-full mt-4">
            <View
              className="h-2 bg-blue-500 rounded-full"
              style={{ width: `${caloriesPercent}%` }}
            />
          </View>
        </TouchableOpacity>

        {/* Macros */}
        <View className="flex-row gap-3 mb-5">
          {[
            {
              label: "Protein",
              value: Math.round(totals.protein),
              target: goals?.protein?.target,
              color: "text-blue-400",
            },
            {
              label: "Carbs",
              value: Math.round(totals.carbs),
              target: goals?.carbs?.target,
              color: "text-amber-400",
            },
            {
              label: "Fat",
              value: Math.round(totals.fat),
              target: goals?.fat?.target,
              color: "text-rose-400",
            },
          ].map(({ label, value, target, color }) => (
            <View
              key={label}
              className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-800"
            >
              <Text className="text-slate-400 text-xs mb-1">{label}</Text>
              <Text className={`text-xl font-bold ${color}`}>{value}g</Text>
              {target != null && (
                <Text className="text-slate-600 text-xs mt-0.5">
                  / {target}g
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Meals by type */}
        {MEAL_TYPE_ORDER.map((mealType) => {
          const { label, icon } = MEAL_TYPE_MAP[mealType];
          const meal = summary?.meals.find((m) => m.mealType === mealType);
          const mealKcal = meal ? Math.round(meal.totals.calories) : 0;

          return (
            <View
              key={mealType}
              className="bg-slate-900 rounded-xl p-4 mb-3 border border-slate-800"
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <Ionicons name={icon} size={16} color="#64748b" />
                  <Text className="text-white text-base font-semibold">
                    {label}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Text className="text-slate-500 text-sm">{mealKcal} kcal</Text>
                  <TouchableOpacity>
                    <Ionicons name="add" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </View>

              {meal && meal.items.length > 0 ? (
                meal.items.map((item) => {
                  const foodName = [item.food.name, item.food.variant]
                    .filter(Boolean)
                    .join(" · ");
                  const servingLabel = `${item.quantity}× ${item.serving.size}${item.serving.unit}`;
                  const itemKcal = Math.round(item.nutrition.calories ?? 0);

                  return (
                    <View
                      key={item.id}
                      className="flex-row justify-between items-center mt-2 pt-2 border-t border-slate-800"
                    >
                      <View className="flex-1 mr-3">
                        <Text className="text-white text-sm" numberOfLines={1}>
                          {foodName}
                        </Text>
                        <Text className="text-slate-500 text-xs mt-0.5">
                          {servingLabel}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1.5">
                        {item.isEstimated && (
                          <Ionicons
                            name="alert-circle-outline"
                            size={13}
                            color="#f59e0b"
                          />
                        )}
                        <Text className="text-slate-400 text-sm">
                          {itemKcal} kcal
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text className="text-slate-600 text-sm mt-2">No items yet</Text>
              )}
            </View>
          );
        })}
      </View>

      <GoalsModal
        visible={goalsVisible}
        onClose={() => setGoalsVisible(false)}
      />
    </ScrollView>
  );
}
