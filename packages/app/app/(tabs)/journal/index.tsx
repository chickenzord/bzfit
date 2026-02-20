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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useDailySummary,
  useNutritionGoal,
  useMealDates,
  type NutritionGoal,
} from "../../../lib/nutrition";

function formatGoalDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
import { QuickAddModal } from "./QuickAddModal";
import { MealDetailModal } from "./MealDetailModal";

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
  const { goal, loading, update, saveAsNew } = useNutritionGoal();
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

  function buildTargets() {
    return {
      ...(form.calories ? { caloriesTarget: Number(form.calories) } : {}),
      ...(form.protein ? { proteinTarget: Number(form.protein) } : {}),
      ...(form.carbs ? { carbsTarget: Number(form.carbs) } : {}),
      ...(form.fat ? { fatTarget: Number(form.fat) } : {}),
    };
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      if (goal) {
        await update(buildTargets());
      } else {
        await saveAsNew(buildTargets());
      }
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsNew = async () => {
    setSaving(true);
    try {
      await saveAsNew(buildTargets());
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
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white text-xl font-bold">
                Nutrition Goals
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {goal && !editing && (
              <Text className="text-slate-500 text-xs mb-5">
                Since {formatGoalDate(goal.startDate)}
              </Text>
            )}
            {!goal && !editing && (
              <View className="mb-5" />
            )}

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
                {goal && (
                  <TouchableOpacity
                    onPress={handleSaveAsNew}
                    disabled={saving}
                    className="mt-3 py-3 rounded-xl border border-blue-500/30 items-center"
                  >
                    <Text className="text-blue-400 text-sm">Save as a New Goal</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {!goal && (
                  <Text className="text-slate-500 text-sm mb-4">
                    No goals set yet. Tap "Set Goals" to add your daily targets.
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
                  <Text className="text-slate-300">{goal ? "Edit Goals" : "Set Goals"}</Text>
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
  const insets = useSafeAreaInsets();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [expanded, setExpanded] = useState(false);
  const [gridMonth, setGridMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [goalsVisible, setGoalsVisible] = useState(false);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [quickAddMealType, setQuickAddMealType] = useState<
    "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | undefined
  >(undefined);
  const [selectedMealType, setSelectedMealType] = useState<
    "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | null
  >(null);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 1); // 1 day ahead as timezone buffer
  const days = generateDays(today, 91).filter((d) => d <= maxDate);
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

  // Scroll to selected date when calendar collapses
  useEffect(() => {
    if (expanded) return;
    const selectedIdx = days.findIndex((d) => isSameDay(d, selectedDate));
    if (flatListRef.current && selectedIdx >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: selectedIdx,
          viewPosition: 0.5,
          animated: true,
        });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const dateStr = toDateString(selectedDate);
  const { data: summary, loading, refresh } = useDailySummary(dateStr);

  const totals = summary?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const goals = summary?.goals;
  const caloriesTarget = goals?.calories?.target ?? null;
  const caloriesPercent = Math.min(goals?.calories?.percentage ?? 0, 100);

  const selectedMeal =
    summary?.meals.find((m) => m.mealType === selectedMealType) ?? null;

  // Date range for calendar dots: union of strip range and current grid month
  const gridMonthStart = new Date(gridMonth.year, gridMonth.month, 1);
  const gridMonthEnd = new Date(gridMonth.year, gridMonth.month + 1, 0);
  const datesFrom = toDateString(days[0] < gridMonthStart ? days[0] : gridMonthStart);
  const datesTo = toDateString(days[days.length - 1] > gridMonthEnd ? days[days.length - 1] : gridMonthEnd);
  const { dates: entryDates, refresh: refreshDates } = useMealDates(datesFrom, datesTo);

  function refreshAll() {
    refresh();
    refreshDates();
  }

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
      <View className="bg-slate-950 pb-3 border-b border-slate-800" style={{ paddingTop: insets.top + 12 }}>
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
            <TouchableOpacity
              onPress={() => {
                setQuickAddMealType(undefined);
                setQuickAddVisible(true);
              }}
            >
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
                  {!isSelected && (isToday || entryDates.has(toDateString(item))) && (
                    <View
                      className={`w-1 h-1 rounded-full mt-0.5 ${isToday ? "bg-blue-400" : "bg-slate-400"}`}
                    />
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
                      disabled={date > maxDate}
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
                          date > maxDate
                            ? "text-slate-700"
                            : isSameDay(date, selectedDate)
                            ? "text-white"
                            : isSameDay(date, today)
                            ? "text-blue-400"
                            : "text-white"
                        }`}
                      >
                        {date.getDate()}
                      </Text>
                      {!isSameDay(date, selectedDate) && (isSameDay(date, today) || entryDates.has(toDateString(date))) && (
                        <View
                          className={`w-1 h-1 rounded-full mt-0.5 ${isSameDay(date, today) ? "bg-blue-400" : "bg-slate-400"}`}
                        />
                      )}
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
            <TouchableOpacity
              key={mealType}
              activeOpacity={meal && meal.items.length > 0 ? 0.7 : 1}
              onPress={() => {
                if (meal && meal.items.length > 0) {
                  setSelectedMealType(mealType);
                }
              }}
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
                  <TouchableOpacity
                    onPress={() => {
                      setQuickAddMealType(mealType);
                      setQuickAddVisible(true);
                    }}
                  >
                    <Ionicons name="add" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </View>

              {meal && meal.items.length > 0 ? (
                meal.items.map((item) => {
                  const foodName = [item.food.name, item.food.variant]
                    .filter(Boolean)
                    .join(" · ");
                  const totalServing = +(item.quantity * item.serving.size).toFixed(1);
                  const servingLabel = `${totalServing}${item.serving.unit}`;
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
            </TouchableOpacity>
          );
        })}
      </View>

      <MealDetailModal
        visible={selectedMealType !== null}
        onClose={() => setSelectedMealType(null)}
        meal={selectedMeal}
        dateLabel={selectedLabel}
        onItemDeleted={refreshAll}
      />
      <QuickAddModal
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
        onSuccess={refreshAll}
        date={dateStr}
        defaultMealType={quickAddMealType}
        summary={summary}
      />
      <GoalsModal
        visible={goalsVisible}
        onClose={() => setGoalsVisible(false)}
      />
    </ScrollView>
  );
}
