import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Icon, type IconName } from "../lib/icons";

export type ServingStatus = "VERIFIED" | "NEEDS_REVIEW" | "USER_CREATED";

export interface ServingFormValues {
  name: string;
  sizeStr: string;
  unitStr: string;
  caloriesStr: string;
  proteinStr: string;
  carbsStr: string;
  fatStr: string;
  status: ServingStatus;
  isDefault: boolean;
}

interface ServingFormProps {
  food: { name: string; variant: string | null; brand: string | null };
  initialValues?: Partial<ServingFormValues>;
  /** Called with form values on submit. Should throw on API error. */
  onSave: (values: ServingFormValues) => Promise<void>;
  submitLabel?: string;
  showIsDefault?: boolean;
}

const STATUS_OPTIONS: ServingStatus[] = ["VERIFIED", "NEEDS_REVIEW", "USER_CREATED"];

const STATUS_LABEL: Record<ServingStatus, string> = {
  VERIFIED: "Verified",
  NEEDS_REVIEW: "Needs Review",
  USER_CREATED: "User Created",
};

const STATUS_COLOR: Record<ServingStatus, string> = {
  VERIFIED: "#22c55e",
  NEEDS_REVIEW: "#f59e0b",
  USER_CREATED: "#3b82f6",
};

export function ServingForm({
  food,
  initialValues,
  onSave,
  submitLabel = "Save",
  showIsDefault = false,
}: ServingFormProps) {
  const [nameStr, setNameStr] = useState(initialValues?.name ?? "");
  const [sizeStr, setSizeStr] = useState(initialValues?.sizeStr ?? "");
  const [unitStr, setUnitStr] = useState(initialValues?.unitStr ?? "");
  const [caloriesStr, setCaloriesStr] = useState(initialValues?.caloriesStr ?? "");
  const [proteinStr, setProteinStr] = useState(initialValues?.proteinStr ?? "");
  const [carbsStr, setCarbsStr] = useState(initialValues?.carbsStr ?? "");
  const [fatStr, setFatStr] = useState(initialValues?.fatStr ?? "");
  const [status, setStatus] = useState<ServingStatus>(initialValues?.status ?? "NEEDS_REVIEW");
  const [statusOpen, setStatusOpen] = useState(false);
  const [isDefault, setIsDefault] = useState(initialValues?.isDefault ?? false);

  const [scaleNutrition, setScaleNutrition] = useState(false);
  const originalSizeRef = useRef(0);
  const originalNutritionRef = useRef({ calories: "", protein: "", carbs: "", fat: "" });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleScaleToggle = () => {
    const next = !scaleNutrition;
    setScaleNutrition(next);
    if (next) {
      originalSizeRef.current = parseFloat(sizeStr) || 0;
      originalNutritionRef.current = {
        calories: caloriesStr,
        protein: proteinStr,
        carbs: carbsStr,
        fat: fatStr,
      };
    }
  };

  const handleSizeChange = useCallback(
    (val: string) => {
      setSizeStr(val);
      if (scaleNutrition && originalSizeRef.current > 0 && !val.endsWith(".")) {
        const newSize = parseFloat(val);
        if (!isNaN(newSize) && newSize > 0) {
          const ratio = newSize / originalSizeRef.current;
          const scale = (orig: string, dp: number) => {
            const n = parseFloat(orig);
            return isNaN(n) ? orig : String(+(n * ratio).toFixed(dp));
          };
          setCaloriesStr(scale(originalNutritionRef.current.calories, 1));
          setProteinStr(scale(originalNutritionRef.current.protein, 2));
          setCarbsStr(scale(originalNutritionRef.current.carbs, 2));
          setFatStr(scale(originalNutritionRef.current.fat, 2));
        }
      }
    },
    [scaleNutrition]
  );

  const isValid =
    !isNaN(parseFloat(sizeStr)) && parseFloat(sizeStr) > 0 && unitStr.trim().length > 0;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({ name: nameStr, sizeStr, unitStr, caloriesStr, proteinStr, carbsStr, fatStr, status, isDefault });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const displayName = [food.name, food.variant].filter(Boolean).join(" · ");

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-950"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Food context */}
        <View className="mb-5">
          <Text className="text-white text-lg font-semibold" numberOfLines={1}>
            {displayName}
          </Text>
          {food.brand && (
            <Text className="text-slate-500 text-sm mt-0.5">{food.brand}</Text>
          )}
        </View>

        {/* Basic info */}
        <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">Basic Info</Text>

        <Text className="text-slate-500 text-xs mb-1">
          Name <Text className="text-slate-600">(optional)</Text>
        </Text>
        <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-4">
          <TextInput
            value={nameStr}
            onChangeText={setNameStr}
            placeholder="e.g. Small, 1 cup"
            placeholderTextColor="#475569"
            style={{ color: "white" }}
          />
        </View>

        <View className="flex-row gap-3 mb-2">
          <View className="flex-[2]">
            <Text className="text-slate-500 text-xs mb-1">
              Size <Text className="text-rose-500">*</Text>
            </Text>
            <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
              <TextInput
                value={sizeStr}
                onChangeText={handleSizeChange}
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
                value={unitStr}
                onChangeText={setUnitStr}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="g"
                placeholderTextColor="#475569"
                style={{ color: "white" }}
              />
            </View>
          </View>
        </View>

        {/* Proportion lock */}
        <TouchableOpacity
          onPress={handleScaleToggle}
          activeOpacity={0.7}
          className="flex-row items-center gap-2 mb-6"
        >
          <View
            className={`w-4 h-4 rounded border items-center justify-center ${
              scaleNutrition ? "bg-blue-500 border-blue-500" : "border-slate-600"
            }`}
          >
            {scaleNutrition && <Icon name="check" size={11} color="white" />}
          </View>
          <Text className="text-slate-400 text-sm">Scale nutrition to size</Text>
        </TouchableOpacity>

        {/* Nutrition */}
        <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">
          Nutrition{" "}
          <Text className="text-slate-600 normal-case tracking-normal">(per serving)</Text>
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

        {/* Status */}
        <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3 mt-2">Status</Text>

        <TouchableOpacity
          onPress={() => setStatusOpen((v) => !v)}
          className="flex-row items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-1"
        >
          <View className="flex-row items-center gap-2">
            <View
              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLOR[status] }}
            />
            <Text className="text-white">{STATUS_LABEL[status]}</Text>
          </View>
          <Icon name={statusOpen ? "chevron-up" : "chevron-down"} size={18} color="#64748b" />
        </TouchableOpacity>

        {statusOpen && (
          <View className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-4">
            {STATUS_OPTIONS.map((s, i) => (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  setStatus(s);
                  setStatusOpen(false);
                }}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  i > 0 ? "border-t border-slate-800" : ""
                }`}
              >
                <View className="flex-row items-center gap-2">
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: STATUS_COLOR[s],
                    }}
                  />
                  <Text className={status === s ? "text-blue-400 font-medium" : "text-white"}>
                    {STATUS_LABEL[s]}
                  </Text>
                </View>
                {status === s && <Icon name="check" size={18} color="#3b82f6" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!statusOpen && <View className="mb-2" />}

        {/* Default toggle */}
        {showIsDefault && (
          <TouchableOpacity
            onPress={() => setIsDefault((v) => !v)}
            activeOpacity={0.7}
            className="flex-row items-center gap-2 mb-6"
          >
            <View
              className={`w-4 h-4 rounded border items-center justify-center ${
                isDefault ? "bg-blue-500 border-blue-500" : "border-slate-600"
              }`}
            >
              {isDefault && <Icon name="check" size={11} color="white" />}
            </View>
            <Text className="text-slate-400 text-sm">Set as default serving</Text>
          </TouchableOpacity>
        )}

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
              {submitLabel}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
