import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MEAL_TYPES = [
  { type: "Breakfast", icon: "sunny-outline" as const },
  { type: "Lunch", icon: "partly-sunny-outline" as const },
  { type: "Dinner", icon: "moon-outline" as const },
  { type: "Snack", icon: "cafe-outline" as const },
];

const ITEM_WIDTH = 48;

export default function JournalScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [expanded, setExpanded] = useState(false);
  const [gridMonth, setGridMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

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
          <TouchableOpacity>
            <Ionicons name="add-circle-outline" size={28} color="#3b82f6" />
          </TouchableOpacity>
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
        <Text className="text-slate-400 text-sm mb-4">{selectedLabel}</Text>

        {/* Calories card */}
        <View className="bg-slate-900 rounded-2xl p-5 mb-4 border border-slate-800">
          <Text className="text-slate-400 text-sm mb-2">Calories</Text>
          <View className="flex-row items-end gap-2">
            <Text className="text-white text-4xl font-bold">0</Text>
            <Text className="text-slate-500 text-lg mb-1">/ 2,000 kcal</Text>
          </View>
          <View className="h-2 bg-slate-800 rounded-full mt-4">
            <View className="h-2 bg-blue-500 rounded-full w-0" />
          </View>
        </View>

        {/* Macros */}
        <View className="flex-row gap-3 mb-5">
          {[
            { label: "Protein", value: "0g", color: "text-blue-400" },
            { label: "Carbs", value: "0g", color: "text-amber-400" },
            { label: "Fat", value: "0g", color: "text-rose-400" },
          ].map(({ label, value, color }) => (
            <View
              key={label}
              className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-800"
            >
              <Text className="text-slate-400 text-xs mb-1">{label}</Text>
              <Text className={`text-xl font-bold ${color}`}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Meals by type */}
        {MEAL_TYPES.map(({ type, icon }) => (
          <View
            key={type}
            className="bg-slate-900 rounded-xl p-4 mb-3 border border-slate-800"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <Ionicons name={icon} size={16} color="#64748b" />
                <Text className="text-white text-base font-semibold">
                  {type}
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-slate-500 text-sm">0 kcal</Text>
                <TouchableOpacity>
                  <Ionicons name="add" size={20} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </View>
            <Text className="text-slate-600 text-sm mt-2">No items yet</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
