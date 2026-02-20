import { useState, useEffect } from "react";
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
import { apiFetch, ApiError } from "../../../../../lib/api";

interface Serving {
  id: string;
  name: string | null;
  size: number;
  unit: string;
  isDefault: boolean;
}

interface Food {
  id: string;
  name: string;
  variant: string | null;
  brand: string | null;
  servings: Serving[];
}

export default function FoodEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingServing, setAddingServing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [variant, setVariant] = useState("");
  const [brand, setBrand] = useState("");
  const [servings, setServings] = useState<Serving[]>([]);
  const [defaultServingId, setDefaultServingId] = useState<string | null>(null);
  const [originalDefaultServingId, setOriginalDefaultServingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch<Food>(`/catalog/foods/${id}`)
      .then((food) => {
        setName(food.name);
        setVariant(food.variant ?? "");
        setBrand(food.brand ?? "");
        setServings(food.servings);
        const def = food.servings.find((s) => s.isDefault);
        setDefaultServingId(def?.id ?? null);
        setOriginalDefaultServingId(def?.id ?? null);
      })
      .catch((e) =>
        setLoadError(e instanceof ApiError ? e.message : "Failed to load food")
      )
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await apiFetch(`/catalog/foods/${id}`, {
        method: "PATCH",
        body: {
          name: name.trim(),
          variant: variant.trim() || undefined,
          brand: brand.trim() || undefined,
        },
      });

      if (defaultServingId && defaultServingId !== originalDefaultServingId) {
        await apiFetch(`/catalog/servings/${defaultServingId}`, {
          method: "PATCH",
          body: { isDefault: true },
        });
      }

      router.replace(`/catalog/foods/${id}?edited=true`);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddServing() {
    setAddingServing(true);
    try {
      const newServing = await apiFetch<{ id: string }>(`/catalog/servings`, {
        method: "POST",
        body: { foodId: id, size: 100, unit: "g" },
      });
      router.push(`/catalog/servings/${newServing.id}?isNew=true`);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Failed to add serving");
    } finally {
      setAddingServing(false);
    }
  }

  const isValid = name.trim().length > 0;

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
        {/* Food Info */}
        <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">Food Info</Text>

        <Text className="text-slate-500 text-xs mb-1">
          Name <Text className="text-rose-500">*</Text>
        </Text>
        <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-4">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. French Fries"
            placeholderTextColor="#475569"
            style={{ color: "white" }}
          />
        </View>

        <Text className="text-slate-500 text-xs mb-1">
          Variant <Text className="text-slate-600">(optional)</Text>
        </Text>
        <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-4">
          <TextInput
            value={variant}
            onChangeText={setVariant}
            placeholder="e.g. Curly, Waffle"
            placeholderTextColor="#475569"
            style={{ color: "white" }}
          />
        </View>

        <Text className="text-slate-500 text-xs mb-1">
          Brand <Text className="text-slate-600">(optional)</Text>
        </Text>
        <View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-6">
          <TextInput
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g. McDonald's"
            placeholderTextColor="#475569"
            style={{ color: "white" }}
          />
        </View>

        {/* Default Serving */}
        {servings.length > 0 && (
          <>
            <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">Default Serving</Text>
            <View className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
              {servings.map((s, i) => {
                const label = s.name ?? `${s.size}${s.unit}`;
                const isSelected = defaultServingId === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => setDefaultServingId(s.id)}
                    className={`flex-row items-center justify-between px-4 py-3 ${
                      i > 0 ? "border-t border-slate-800" : ""
                    }`}
                  >
                    <Text className={isSelected ? "text-blue-400 font-medium" : "text-white"}>
                      {label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#3b82f6" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Servings */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-slate-400 text-xs uppercase tracking-wide">Servings</Text>
          <TouchableOpacity
            onPress={handleAddServing}
            disabled={addingServing}
            className="flex-row items-center gap-1"
          >
            {addingServing ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Ionicons name="add" size={16} color="#3b82f6" />
            )}
            <Text className="text-blue-500 text-xs">Add Serving</Text>
          </TouchableOpacity>
        </View>

        {servings.length === 0 && (
          <Text className="text-slate-600 text-sm mb-4">No servings yet.</Text>
        )}

        {servings.map((s) => (
          <View
            key={s.id}
            className="flex-row items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-2"
          >
            <View className="flex-1 mr-2">
              <Text className="text-white text-sm">
                {s.name ?? `${s.size}${s.unit}`}
              </Text>
              {s.name && (
                <Text className="text-slate-500 text-xs mt-0.5">
                  {s.size}{s.unit}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/catalog/servings/${s.id}`)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil-outline" size={16} color="#475569" />
            </TouchableOpacity>
          </View>
        ))}

        {servings.length > 0 && <View className="mb-4" />}

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
