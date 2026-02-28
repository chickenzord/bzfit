import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { apiFetch } from "./api";

type UpdateFoodData = {
  name?: string;
  variant?: string | null;
  brand?: string | null;
};

type UpdateServingData = {
  name?: string | null;
  size?: number;
  unit?: string;
  isDefault?: boolean;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
};

export const useUpdateFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFoodData }) => {
      return apiFetch(`/catalog/foods/${id}`, { method: "PATCH", body: data });
    },
    onSuccess: (_, variables) => {
      // Food name/brand is embedded in the denormalized daily-summary response,
      // so nutrition cache must also be invalidated to reflect the updated name in Journal.
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.foods() });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.food(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.root() });
    },
  });
};

export const useUpdateServing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, foodId, data }: { id: string; foodId: string; data: UpdateServingData }) => {
      return apiFetch(`/catalog/servings/${id}`, { method: "PATCH", body: data });
    },
    onSuccess: (_, variables) => {
      // Serving nutrition/status changed — also invalidate all nutrition queries
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.foods() });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.food(variables.foodId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.serving(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.needsReview() });
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.root() });
    },
  });
};

export const useDeleteServing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return apiFetch(`/catalog/servings/${id}`, { method: "DELETE" });
    },
    onSuccess: (_, variables) => {
      // Serving deletion cascade-deletes meal items → journal totals change
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.needsReview() });
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.root() });
    },
  });
};

export const useDeleteFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, force = false }: { id: string; force?: boolean }) => {
      return apiFetch(`/catalog/foods/${id}${force ? "?force=true" : ""}`, { method: "DELETE" });
    },
    onSuccess: () => {
      // Delete food — invalidate all catalog and nutrition queries
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.root() });
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.root() });
    },
  });
};
