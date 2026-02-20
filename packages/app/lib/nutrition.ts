import { useState, useEffect, useCallback } from "react";
import { apiFetch, ApiError } from "./api";

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealItem = {
  id: string;
  quantity: number;
  isEstimated: boolean;
  notes: string | null;
  food: {
    id: string;
    name: string;
    variant: string | null;
    brand: string | null;
  };
  serving: {
    id: string;
    name: string | null;
    size: number;
    unit: string;
    calories: number | null;
  };
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
};

export type Meal = {
  id: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  items: MealItem[];
  totals: NutritionTotals;
};

export type MacroProgress = {
  target: number | null;
  actual: number;
  percentage: number | null;
};

export type GoalProgress = {
  calories: MacroProgress;
  protein: MacroProgress;
  carbs: MacroProgress;
  fat: MacroProgress;
};

export type DailySummary = {
  date: string;
  meals: Meal[];
  totals: NutritionTotals;
  goals: GoalProgress | null;
};

export type NutritionGoal = {
  id: string;
  userId: string;
  caloriesTarget: number | null;
  proteinTarget: number | null;
  carbsTarget: number | null;
  fatTarget: number | null;
  fiberTarget: number | null;
  sugarTarget: number | null;
  sodiumTarget: number | null;
  startDate: string;
  endDate: string | null;
  isLatest: boolean;
  createdAt: string;
  updatedAt: string;
};

type GoalTargets = {
  caloriesTarget?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
};

export function useDailySummary(date: string) {
  const [data, setData] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<DailySummary>(
        `/nutrition/meals/daily-summary?date=${date}`,
      );
      setData(result);
    } catch (e: any) {
      setError(e.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useNutritionGoal() {
  const [goal, setGoal] = useState<NutritionGoal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<NutritionGoal | null>("/nutrition/goals");
      setGoal(result);
    } catch (e: any) {
      if (e.status === 404) {
        setGoal(null);
      } else {
        setError(e.message ?? "Failed to load goal");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = async (targets: GoalTargets) => {
    if (!goal) throw new Error("No active goal to update");
    const result = await apiFetch<NutritionGoal>(`/nutrition/goals/${goal.id}`, {
      method: "PATCH",
      body: targets,
    });
    setGoal(result);
    return result;
  };

  const saveAsNew = async (targets: GoalTargets & { startDate?: string }) => {
    const result = await apiFetch<NutritionGoal>("/nutrition/goals", {
      method: "POST",
      body: targets,
    });
    setGoal(result);
    return result;
  };

  return { goal, loading, error, refresh, update, saveAsNew };
}

export function useNutritionGoals() {
  const [goals, setGoals] = useState<NutritionGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<NutritionGoal[]>("/nutrition/goals/all");
      setGoals(result);
    } catch (e: any) {
      setError(e.message ?? "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (targets: GoalTargets & { startDate?: string }) => {
    const result = await apiFetch<NutritionGoal>("/nutrition/goals", {
      method: "POST",
      body: targets,
    });
    await refresh();
    return result;
  };

  const update = async (id: string, targets: GoalTargets) => {
    const result = await apiFetch<NutritionGoal>(`/nutrition/goals/${id}`, {
      method: "PATCH",
      body: targets,
    });
    await refresh();
    return result;
  };

  const remove = async (id: string) => {
    await apiFetch(`/nutrition/goals/${id}`, { method: "DELETE" });
    await refresh();
  };

  return { goals, loading, error, refresh, create, update, remove };
}

export async function quickAdd(dto: {
  food: { name: string; variant?: string; brand?: string };
  servingSize: number;
  servingUnit: string;
  quantity?: number;
  mealType: string;
  date: string;
}) {
  return apiFetch("/nutrition/meals/quick-add", { method: "POST", body: dto });
}

export async function logMealItem(params: {
  mealId: string;
  foodId: string;
  servingId: string;
  quantity: number;
}) {
  return apiFetch(`/nutrition/meals/${params.mealId}/items`, {
    method: "POST",
    body: {
      foodId: params.foodId,
      servingId: params.servingId,
      quantity: params.quantity,
    },
  });
}

export async function deleteMealItem(itemId: string): Promise<void> {
  try {
    await apiFetch(`/nutrition/meal-items/${itemId}`, { method: "DELETE" });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    // JSON parse error on 204 No Content is expected — treat as success
  }
}

export async function createMealWithItem(params: {
  date: string;
  mealType: string;
  foodId: string;
  servingId: string;
  quantity: number;
}) {
  return apiFetch("/nutrition/meals", {
    method: "POST",
    body: {
      date: params.date,
      mealType: params.mealType,
      items: [
        {
          foodId: params.foodId,
          servingId: params.servingId,
          quantity: params.quantity,
        },
      ],
    },
  });
}
