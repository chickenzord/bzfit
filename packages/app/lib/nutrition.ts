import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "./api";
import { queryKeys } from "./query-keys";

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealItem = {
  id: string;
  quantity: number;
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
    status: "VERIFIED" | "NEEDS_REVIEW" | "USER_CREATED";
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
  const query = useQuery({
    queryKey: queryKeys.nutrition.dailySummary(date),
    queryFn: () => apiFetch<DailySummary>(`/nutrition/meals/daily-summary?date=${date}`),
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: () => query.refetch(),
  };
}

export function useNutritionGoal() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.goals.currentGoal(),
    queryFn: async () => {
      try {
        return await apiFetch<NutritionGoal>("/nutrition/goals");
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, targets }: { id: string; targets: GoalTargets }) =>
      apiFetch<NutritionGoal>(`/nutrition/goals/${id}`, { method: "PATCH", body: targets }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.currentGoal() });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.allGoals() });
    },
  });

  const saveAsNewMutation = useMutation({
    mutationFn: (targets: GoalTargets & { startDate?: string }) =>
      apiFetch<NutritionGoal>("/nutrition/goals", { method: "POST", body: targets }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.currentGoal() });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.allGoals() });
    },
  });

  return {
    goal: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: () => queryClient.invalidateQueries({ queryKey: queryKeys.goals.currentGoal() }),
    update: async (targets: GoalTargets) => {
      const goal = query.data;
      if (!goal) throw new Error("No active goal to update");
      return updateMutation.mutateAsync({ id: goal.id, targets });
    },
    saveAsNew: (targets: GoalTargets & { startDate?: string }) =>
      saveAsNewMutation.mutateAsync(targets),
  };
}

export function useNutritionGoals() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.goals.allGoals(),
    queryFn: () => apiFetch<NutritionGoal[]>("/nutrition/goals/all"),
  });

  const createMutation = useMutation({
    mutationFn: (targets: GoalTargets & { startDate?: string }) =>
      apiFetch<NutritionGoal>("/nutrition/goals", { method: "POST", body: targets }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.allGoals() });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.currentGoal() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, targets }: { id: string; targets: GoalTargets }) =>
      apiFetch<NutritionGoal>(`/nutrition/goals/${id}`, { method: "PATCH", body: targets }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.allGoals() });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.currentGoal() });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/nutrition/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.allGoals() });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.currentGoal() });
    },
  });

  return {
    goals: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: () => queryClient.invalidateQueries({ queryKey: queryKeys.goals.allGoals() }),
    create: (targets: GoalTargets & { startDate?: string }) =>
      createMutation.mutateAsync(targets),
    update: (id: string, targets: GoalTargets) =>
      updateMutation.mutateAsync({ id, targets }),
    remove: (id: string) => removeMutation.mutateAsync(id),
  };
}

export function useMealDates(from: string, to: string) {
  const query = useQuery({
    queryKey: queryKeys.nutrition.mealDates(from, to),
    queryFn: async () => {
      const result = await apiFetch<string[]>(
        `/nutrition/meals/dates?from=${from}&to=${to}`,
      );
      return new Set(result);
    },
    enabled: !!(from && to),
  });

  return {
    dates: query.data ?? new Set<string>(),
    refresh: () => query.refetch(),
  };
}

export const useQuickAdd = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      food: { name: string; variant?: string; brand?: string };
      servingSize: number;
      servingUnit: string;
      quantity?: number;
      mealType: string;
      date: string;
    }) => {
      return apiFetch("/nutrition/meals/quick-add", { method: "POST", body: dto });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.foods() });
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.dailySummary(variables.date) });
      // Invalidate all meal dates since a new meal item might affect dates
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.root() });
    },
  });
};

export const useLogMealItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      mealId: string;
      foodId: string;
      servingId: string;
      quantity: number;
      date: string; // Add date to params for invalidation
    }) => {
      return apiFetch(`/nutrition/meals/${params.mealId}/items`, {
        method: "POST",
        body: {
          foodId: params.foodId,
          servingId: params.servingId,
          quantity: params.quantity,
        },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.dailySummary(variables.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.root() }); // Invalidate all meal dates
    },
  });
};

export const useUpdateMealItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, quantity, date }: { itemId: string; quantity: number; date: string }) => {
      await apiFetch(`/nutrition/meal-items/${itemId}`, {
        method: "PATCH",
        body: { quantity },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.dailySummary(variables.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.root() }); // Invalidate all meal dates
    },
  });
};

export const useDeleteMealItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, date }: { itemId: string; date: string }) => {
      try {
        await apiFetch(`/nutrition/meal-items/${itemId}`, { method: "DELETE" });
      } catch (e) {
        if (e instanceof ApiError) throw e;
        // JSON parse error on 204 No Content is expected — treat as success
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.dailySummary(variables.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.root() }); // Invalidate all meal dates
    },
  });
};

export const useCreateMealWithItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      date: string;
      mealType: string;
      foodId: string;
      servingId: string;
      quantity: number;
    }) => {
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
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.dailySummary(variables.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.root() }); // Invalidate all meal dates
    },
  });
};
