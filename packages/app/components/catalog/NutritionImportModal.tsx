import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/lib/icons";
import { apiFetch } from "@/lib/api";
import {
  NutritionProvider,
  NutritionResult,
  useNutritionImport,
  useApplyImportedNutrition,
} from "@/lib/catalog";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  visible: boolean;
  servingId: string;
  servingSize: number;
  servingUnit: string;
  onClose: () => void;
  /** Called after nutrition is successfully applied to the serving */
  onApplied: () => void;
};

// ---------------------------------------------------------------------------
// Scaling logic
// ---------------------------------------------------------------------------

type ScaleResult = {
  patch: Record<string, unknown>;
  warning: string | null;
};

function applyScaling(
  result: NutritionResult,
  servingSize: number,
  servingUnit: string,
): ScaleResult {
  const { resultServingSize, resultServingUnit } = result;

  // Provider returned values for the exact serving already (e.g. OpenAI)
  if (!resultServingSize || !resultServingUnit) {
    return { patch: buildPatch(result, servingUnit), warning: null };
  }

  const unitsMatch =
    servingUnit.toLowerCase().trim() === resultServingUnit.toLowerCase().trim();

  if (!unitsMatch) {
    // Override serving unit to match provider, apply values as-is, warn user
    return {
      patch: buildPatch(result, resultServingUnit),
      warning: `Serving unit changed from "${servingUnit}" to "${resultServingUnit}". Values applied as returned by provider (per ${resultServingSize}${resultServingUnit}).`,
    };
  }

  // Units match — scale nutrition values to the stored serving size
  const factor = servingSize / resultServingSize;
  const scale = (v?: number) =>
    v != null ? Math.round(v * factor * 100) / 100 : undefined;

  const scaled: NutritionResult = {
    ...result,
    calories: scale(result.calories),
    protein: scale(result.protein),
    carbs: scale(result.carbs),
    fat: scale(result.fat),
    saturatedFat: scale(result.saturatedFat),
    transFat: scale(result.transFat),
    fiber: scale(result.fiber),
    sugar: scale(result.sugar),
    sodium: scale(result.sodium),
    cholesterol: scale(result.cholesterol),
  };

  return { patch: buildPatch(scaled, servingUnit), warning: null };
}

function buildPatch(result: NutritionResult, unit: string): Record<string, unknown> {
  // Strip undefined fields so they don't overwrite existing values with null
  const patch: Record<string, unknown> = { unit, status: "VERIFIED" };
  const fields = [
    "calories", "protein", "carbs", "fat",
    "saturatedFat", "transFat", "fiber", "sugar", "sodium", "cholesterol",
  ] as const;
  for (const key of fields) {
    if (result[key] != null) patch[key] = result[key];
  }
  if (result.sourceLabel) patch.dataSource = result.sourceLabel;
  return patch;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "#22c55e",
  medium: "#f59e0b",
  low: "#ef4444",
};

function MacroRow({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value?: number;
  unit: string;
  color: string;
}) {
  if (value == null) return null;
  return (
    <View className="flex-row items-center justify-between py-0.5">
      <Text style={{ color: "#94a3b8", fontSize: 12 }}>{label}</Text>
      <Text style={{ color, fontSize: 12, fontWeight: "600" }}>
        {value} {unit}
      </Text>
    </View>
  );
}

function ResultCard({
  result,
  servingSize,
  servingUnit,
  onApply,
  applying,
}: {
  result: NutritionResult;
  servingSize: number;
  servingUnit: string;
  onApply: (scaleResult: ScaleResult) => void;
  applying: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  // Pre-compute scaling so the card can preview scaled values and show warnings
  const scaled = applyScaling(result, servingSize, servingUnit);

  return (
    <View className="bg-slate-900 border border-slate-800 rounded-xl mb-3 overflow-hidden">
      {/* Header */}
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
        className="px-4 pt-3.5 pb-2"
      >
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="text-white text-sm font-medium" numberOfLines={2}>
              {result.sourceLabel ?? (result.dataKind === "estimated" ? "AI Estimate" : "Match")}
            </Text>
            <View className="flex-row items-center gap-2 mt-1 flex-wrap">
              {result.dataKind === "estimated" && result.confidence && (
                <View
                  className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ backgroundColor: `${CONFIDENCE_COLOR[result.confidence]}20` }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: CONFIDENCE_COLOR[result.confidence],
                    }}
                  />
                  <Text style={{ color: CONFIDENCE_COLOR[result.confidence], fontSize: 11 }}>
                    {result.confidence} confidence
                  </Text>
                </View>
              )}
              {result.resultServingSize && (
                <Text className="text-slate-500 text-xs">
                  provider: per {result.resultServingSize}{result.resultServingUnit}
                </Text>
              )}
            </View>
          </View>
          <Icon name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#64748b" />
        </View>

        {/* Unit mismatch warning */}
        {scaled.warning && (
          <View className="flex-row items-start gap-1.5 mt-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <Icon name="alert-circle" size={13} color="#f59e0b" />
            <Text className="text-amber-400 text-xs flex-1">{scaled.warning}</Text>
          </View>
        )}

        {/* Core macros (post-scaling) */}
        <View className="flex-row gap-4 mt-2">
          {scaled.patch.calories != null && (
            <Text className="text-white text-xs font-semibold">
              {scaled.patch.calories as number}{" "}
              <Text className="text-slate-400 font-normal">kcal</Text>
            </Text>
          )}
          {scaled.patch.protein != null && (
            <Text className="text-blue-400 text-xs font-semibold">
              P {scaled.patch.protein as number}g
            </Text>
          )}
          {scaled.patch.carbs != null && (
            <Text className="text-amber-400 text-xs font-semibold">
              C {scaled.patch.carbs as number}g
            </Text>
          )}
          {scaled.patch.fat != null && (
            <Text className="text-rose-400 text-xs font-semibold">
              F {scaled.patch.fat as number}g
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View className="px-4 pb-2 border-t border-slate-800 mt-1 pt-2">
          <MacroRow label="Saturated Fat" value={scaled.patch.saturatedFat as number | undefined} unit="g" color="#fb7185" />
          <MacroRow label="Trans Fat" value={scaled.patch.transFat as number | undefined} unit="g" color="#fb7185" />
          <MacroRow label="Fiber" value={scaled.patch.fiber as number | undefined} unit="g" color="#94a3b8" />
          <MacroRow label="Sugar" value={scaled.patch.sugar as number | undefined} unit="g" color="#fbbf24" />
          <MacroRow label="Sodium" value={scaled.patch.sodium as number | undefined} unit="mg" color="#94a3b8" />
          <MacroRow label="Cholesterol" value={scaled.patch.cholesterol as number | undefined} unit="mg" color="#94a3b8" />
        </View>
      )}

      {/* Apply button */}
      <TouchableOpacity
        onPress={() => onApply(scaled)}
        disabled={applying}
        className={`mx-3 mb-3 mt-1 py-2.5 rounded-lg items-center ${applying ? "bg-blue-500/30" : "bg-blue-500"}`}
      >
        {applying ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text className="text-white text-sm font-semibold">Use This</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

export function NutritionImportModal({
  visible,
  servingId,
  servingSize,
  servingUnit,
  onClose,
  onApplied,
}: Props) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [extraContext, setExtraContext] = useState("");
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const providersQuery = useQuery({
    queryKey: ["catalog", "providers"],
    queryFn: () =>
      apiFetch<{ providers: NutritionProvider[] }>("/catalog/providers").then(
        (r) => r.providers,
      ),
    enabled: visible,
    staleTime: 60_000,
  });

  const importMutation = useNutritionImport();
  const applyMutation = useApplyImportedNutrition();

  const availableProviders = (providersQuery.data ?? []).filter(
    (p) => p.available && p.dataType === "nutrition" && p.name !== "open-food-facts",
  );
  const activeProvider = selectedProvider ?? availableProviders[0]?.name ?? null;

  function handleClose() {
    importMutation.reset();
    setApplyError(null);
    setExtraContext("");
    onClose();
  }

  async function handleFetch() {
    if (!activeProvider) return;
    setApplyError(null);
    importMutation.reset();
    await importMutation.mutateAsync({
      servingId,
      provider: activeProvider,
      extraContext: extraContext.trim() || undefined,
    });
  }

  async function handleApply(scaleResult: ScaleResult, index: number) {
    setApplyingIndex(index);
    setApplyError(null);
    try {
      await applyMutation.mutateAsync({ servingId, patch: scaleResult.patch });
      onApplied();
      handleClose();
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : "Failed to apply");
    } finally {
      setApplyingIndex(null);
    }
  }

  const results = importMutation.data?.results ?? [];
  const hasResults = results.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={handleClose}>
        <Pressable onPress={() => {}} className="bg-slate-900 rounded-t-2xl" style={{ maxHeight: "90%" }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pt-5 pb-4 border-b border-slate-800">
            <Text className="text-white text-base font-semibold">Import Nutrition</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Icon name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            automaticallyAdjustKeyboardInsets
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          >
            {/* Provider picker */}
            {providersQuery.isLoading ? (
              <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 16 }} />
            ) : availableProviders.length === 0 ? (
              <View className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
                <Text className="text-amber-400 text-sm">No providers are currently available.</Text>
              </View>
            ) : (
              <>
                <Text className="text-slate-400 text-xs uppercase tracking-wide mb-2">Provider</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {availableProviders.map((p) => {
                    const active = activeProvider === p.name;
                    return (
                      <TouchableOpacity
                        key={p.name}
                        onPress={() => {
                          setSelectedProvider(p.name);
                          importMutation.reset();
                        }}
                        className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                          active
                            ? "bg-blue-500/20 border-blue-500/40"
                            : "bg-slate-800 border-slate-700"
                        }`}
                      >
                        <Icon
                          name={p.kind === "estimation" ? "cpu" : "search"}
                          size={13}
                          color={active ? "#3b82f6" : "#64748b"}
                        />
                        <Text
                          className={`text-sm font-medium ${active ? "text-blue-400" : "text-slate-300"}`}
                        >
                          {p.displayName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Extra context */}
                <Text className="text-slate-400 text-xs uppercase tracking-wide mb-2">
                  Extra Context{" "}
                  <Text className="text-slate-600 normal-case tracking-normal">(optional)</Text>
                </Text>
                <View className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-4">
                  <TextInput
                    value={extraContext}
                    onChangeText={setExtraContext}
                    placeholder='e.g. "grilled, no sauce" or "label says 4.2g fat per 100g"'
                    placeholderTextColor="#475569"
                    style={{ color: "white", fontSize: 14 }}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Fetch button */}
                <TouchableOpacity
                  onPress={handleFetch}
                  disabled={importMutation.isPending || !activeProvider}
                  className={`py-3.5 rounded-xl items-center mb-5 ${
                    importMutation.isPending ? "bg-blue-500/30" : "bg-blue-500"
                  }`}
                >
                  {importMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      {hasResults ? "Fetch Again" : "Fetch Nutrition"}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Import error */}
            {importMutation.isError && (
              <View className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-400 text-sm">
                  {importMutation.error instanceof Error
                    ? importMutation.error.message
                    : "Failed to fetch nutrition data"}
                </Text>
              </View>
            )}

            {/* Apply error */}
            {applyError && (
              <View className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-400 text-sm">{applyError}</Text>
              </View>
            )}

            {/* Results */}
            {hasResults && (
              <>
                <Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">
                  Results
                </Text>
                {results.map((result, i) => (
                  <ResultCard
                    key={i}
                    result={result}
                    servingSize={servingSize}
                    servingUnit={servingUnit}
                    onApply={(scaleResult) => handleApply(scaleResult, i)}
                    applying={applyingIndex === i}
                  />
                ))}
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
