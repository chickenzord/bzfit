import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Icon, type IconName } from "../../../lib/icons";
import { useNutritionGoals, type NutritionGoal } from "../../../lib/nutrition";

function formatGoalDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type GoalFormState = {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

const EMPTY_FORM: GoalFormState = { calories: "", protein: "", carbs: "", fat: "" };

const FORM_FIELDS: { key: keyof GoalFormState; label: string; unit: string }[] = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
];

function formFromGoal(goal: NutritionGoal): GoalFormState {
  return {
    calories: goal.caloriesTarget?.toString() ?? "",
    protein: goal.proteinTarget?.toString() ?? "",
    carbs: goal.carbsTarget?.toString() ?? "",
    fat: goal.fatTarget?.toString() ?? "",
  };
}

function buildTargets(form: GoalFormState) {
  return {
    ...(form.calories ? { caloriesTarget: Number(form.calories) } : {}),
    ...(form.protein ? { proteinTarget: Number(form.protein) } : {}),
    ...(form.carbs ? { carbsTarget: Number(form.carbs) } : {}),
    ...(form.fat ? { fatTarget: Number(form.fat) } : {}),
  };
}

type GoalFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: GoalFormState) => Promise<void>;
  title: string;
  submitLabel: string;
  initialForm?: GoalFormState;
};

function GoalFormModal({ visible, onClose, onSubmit, title, submitLabel, initialForm }: GoalFormModalProps) {
  const [form, setForm] = useState<GoalFormState>(initialForm ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="bg-slate-900 rounded-t-3xl p-6 border-t border-slate-800">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Icon name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {FORM_FIELDS.map(({ key, label, unit }) => (
              <View key={key} className="flex-row items-center justify-between mb-4">
                <Text className="text-slate-400 text-sm">{label}</Text>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={form[key]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
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
                onPress={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-700 items-center"
              >
                <Text className="text-slate-400">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-blue-500 items-center"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold">{submitLabel}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function GoalsScreen() {
  const { goals, loading, create, update, remove } = useNutritionGoals();
  const [createVisible, setCreateVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<NutritionGoal | null>(null);

  const handleCreate = useCallback(async (form: GoalFormState) => {
    await create(buildTargets(form));
  }, [create]);

  const handleUpdate = useCallback(async (form: GoalFormState) => {
    if (!editingGoal) return;
    await update(editingGoal.id, buildTargets(form));
  }, [editingGoal, update]);

  const handleDelete = useCallback((goal: NutritionGoal) => {
    Alert.alert(
      "Delete Goal",
      `Delete the goal starting ${formatGoalDate(goal.startDate)}? This will restore the previous goal as current.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(goal.id);
            } catch (e: any) {
              Alert.alert("Error", e.message ?? "Failed to delete goal");
            }
          },
        },
      ]
    );
  }, [remove]);

  const DISPLAY_ROWS: { key: keyof NutritionGoal; label: string; unit: string; color: string }[] = [
    { key: "caloriesTarget", label: "Calories", unit: "kcal", color: "text-white" },
    { key: "proteinTarget", label: "Protein", unit: "g", color: "text-blue-400" },
    { key: "carbsTarget", label: "Carbs", unit: "g", color: "text-amber-400" },
    { key: "fatTarget", label: "Fat", unit: "g", color: "text-rose-400" },
  ];

  return (
    <ScrollView className="flex-1 bg-slate-950">
      <View className="px-4 pt-4 pb-10">
        {/* New Goal button */}
        <TouchableOpacity
          onPress={() => setCreateVisible(true)}
          className="flex-row items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6"
        >
          <Icon name="plus" size={18} color="#3b82f6" />
          <Text className="text-blue-400 font-semibold">New Goal</Text>
        </TouchableOpacity>

        {loading && goals.length === 0 ? (
          <ActivityIndicator color="#3b82f6" className="mt-8" />
        ) : goals.length === 0 ? (
          <View className="items-center mt-12">
            <Icon name="flag" size={40} color="#334155" />
            <Text className="text-slate-500 text-base mt-3">No goals yet</Text>
            <Text className="text-slate-600 text-sm mt-1">Tap "New Goal" to set your daily targets.</Text>
          </View>
        ) : (
          goals.map((goal) => {
            const dateRange = goal.endDate
              ? `${formatGoalDate(goal.startDate)} – ${formatGoalDate(goal.endDate)}`
              : `Since ${formatGoalDate(goal.startDate)}`;

            return (
              <View
                key={goal.id}
                className={`bg-slate-900 rounded-xl p-4 border mb-3 ${
                  goal.isLatest ? "border-blue-500/30" : "border-slate-800"
                }`}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <View className="flex-row items-center gap-2">
                      {goal.isLatest && (
                        <View className="bg-blue-500/20 rounded px-1.5 py-0.5">
                          <Text className="text-blue-400 text-xs font-medium">Current</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-slate-400 text-xs mt-1">{dateRange}</Text>
                  </View>
                  {goal.isLatest && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => setEditingGoal(goal)}
                        className="p-2"
                      >
                        <Icon name="edit" size={16} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(goal)}
                        className="p-2"
                      >
                        <Icon name="trash" size={16} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View className="flex-row flex-wrap gap-3">
                  {DISPLAY_ROWS.map(({ key, label, unit, color }) => {
                    const value = goal[key] as number | null;
                    return (
                      <View key={key} className="flex-1 min-w-[80px]">
                        <Text className="text-slate-500 text-xs">{label}</Text>
                        <Text className={`text-base font-semibold mt-0.5 ${color}`}>
                          {value != null ? `${value}${unit === "kcal" ? "" : "g"}` : "—"}
                        </Text>
                        {unit === "kcal" && value != null && (
                          <Text className="text-slate-600 text-xs">kcal</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </View>

      <GoalFormModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSubmit={handleCreate}
        title="New Goal"
        submitLabel="Create"
      />

      <GoalFormModal
        visible={editingGoal != null}
        onClose={() => setEditingGoal(null)}
        onSubmit={handleUpdate}
        title="Edit Targets"
        submitLabel="Save"
        initialForm={editingGoal ? formFromGoal(editingGoal) : undefined}
      />
    </ScrollView>
  );
}
