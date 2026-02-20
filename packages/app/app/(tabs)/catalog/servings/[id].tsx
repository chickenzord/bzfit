import { useState, useEffect, useRef, useCallback } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, ApiError } from "../../../../lib/api";

type ServingStatus = "VERIFIED" | "NEEDS_REVIEW" | "USER_CREATED";

interface Serving {
  id: string;
  foodId: string;
  name: string | null;
  size: number;
  unit: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  status: ServingStatus;
}

interface Food {
  id: string;
  name: string;
  variant: string | null;
  brand: string | null;
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

function numStr(v: number | null): string {
  return v != null ? String(v) : "";
}

export default function ServingEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [food, setFood] = useState<Food | null>(null);

  // Form fields
  const [nameStr, setNameStr] = useState("");
  const [sizeStr, setSizeStr] = useState("");
  const [unitStr, setUnitStr] = useState("");
  const [caloriesStr, setCaloriesStr] = useState("");
  const [proteinStr, setProteinStr] = useState("");
  const [carbsStr, setCarbsStr] = useState("");
  const [fatStr, setFatStr] = useState("");
  const [status, setStatus] = useState<ServingStatus>("NEEDS_REVIEW");
  const [statusOpen, setStatusOpen] = useState(false);

  // Proportion lock — transient, not saved
  const [scaleNutrition, setScaleNutrition] = useState(false);
  const originalSizeRef = useRef(0);
  const originalNutritionRef = useRef({ calories: "", protein: "", carbs: "", fat: "" });

  useEffect(() => {
    if (!id) return;
    apiFetch<Serving>(`/catalog/servings/${id}`)
      .then((s) => {
        setNameStr(s.name ?? "");
        setSizeStr(String(s.size));
        setUnitStr(s.unit);
        setCaloriesStr(numStr(s.calories));
        setProteinStr(numStr(s.protein));
        setCarbsStr(numStr(s.carbs));
        setFatStr(numStr(s.fat));
        setStatus(s.status);
        return apiFetch<Food>(`/catalog/foods/${s.foodId}`);
      })
      .then(setFood)
      .catch((e) =>
        setLoadError(e instanceof ApiError ? e.message : "Failed to load serving")
      )
      .finally(() => setLoading(false));
  }, [id]);

  const handleScaleToggle = () => {
    const next = !scaleNutrition;
    setScaleNutrition(next);
    if (next) {
      originalSizeRef.current = parseFloat(sizeStr) || 0;
      originalNutritionRef.current = { calories: caloriesStr, protein: proteinStr, carbs: carbsStr, fat: fatStr };
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

  async function handleSave() {
    const size = parseFloat(sizeStr);
    if (isNaN(size) || size <= 0 || !unitStr.trim()) return;

    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = {
        name: nameStr.trim() || null,
        size,
        unit: unitStr.trim(),
        status,
      };
      const cal = parseFloat(caloriesStr);
      const pro = parseFloat(proteinStr);
      const carb = parseFloat(carbsStr);
      const fat = parseFloat(fatStr);
      if (!isNaN(cal)) body.calories = cal;
      if (!isNaN(pro)) body.protein = pro;
      if (!isNaN(carb)) body.carbs = carb;
      if (!isNaN(fat)) body.fat = fat;

      await apiFetch(`/catalog/servings/${id}`, { method: "PATCH", body });
      router.replace(`/catalog/foods/${food!.id}?editedServingId=${id}`);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const isValid =
    !isNaN(parseFloat(sizeStr)) && parseFloat(sizeStr) > 0 && unitStr.trim().length > 0;

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (loadError) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center px-6">
        <Text className="text-red-400 text-base">{loadError}</Text>
      </View>
    );
  }

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
        {food && (
          <View className="mb-5">
            <Text className="text-white text-lg font-semibold" numberOfLines={1}>
              {[food.name, food.variant].filter(Boolean).join(" · ")}
            </Text>
            {food.brand && (
              <Text className="text-slate-500 text-sm mt-0.5">{food.brand}</Text>
            )}
          </View>
        )}

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
            {scaleNutrition && <Ionicons name="checkmark" size={11} color="white" />}
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
          <Ionicons name={statusOpen ? "chevron-up" : "chevron-down"} size={18} color="#64748b" />
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
                {status === s && <Ionicons name="checkmark" size={18} color="#3b82f6" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!statusOpen && <View className="mb-4" />}

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
  );
}
