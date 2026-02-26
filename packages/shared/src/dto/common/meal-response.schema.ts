import { z } from 'zod';
import { MealType, ServingStatus } from '../../entities';

export const NutritionTotalsSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

export const MealItemResponseSchema = z.object({
  id: z.string(),
  mealId: z.string(),
  foodId: z.string(),
  servingId: z.string(),
  quantity: z.number(),
  notes: z.string().nullable(),
  isEstimated: z.boolean(),
  food: z.object({
    id: z.string(),
    name: z.string(),
    variant: z.string().nullable(),
    brand: z.string().nullable(),
  }),
  serving: z.object({
    id: z.string(),
    name: z.string().nullable(),
    size: z.number(),
    unit: z.string(),
    calories: z.number().nullable(),
    protein: z.number().nullable(),
    carbs: z.number().nullable(),
    fat: z.number().nullable(),
    status: z.nativeEnum(ServingStatus),
  }),
  nutrition: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const MealResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  mealType: z.nativeEnum(MealType),
  notes: z.string().nullable(),
  items: z.array(MealItemResponseSchema),
  totals: NutritionTotalsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type NutritionTotalsDto = z.infer<typeof NutritionTotalsSchema>;
export type MealItemResponseDto = z.infer<typeof MealItemResponseSchema>;
export type MealResponseDto = z.infer<typeof MealResponseSchema>;
