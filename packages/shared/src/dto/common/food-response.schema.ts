import { z } from 'zod';
import { ServingStatus } from '../../entities';

export const ServingResponseSchema = z.object({
  id: z.string(),
  foodId: z.string(),
  name: z.string().nullable(),
  size: z.number(),
  unit: z.string(),
  isDefault: z.boolean(),
  calories: z.number().nullable(),
  protein: z.number().nullable(),
  carbs: z.number().nullable(),
  fat: z.number().nullable(),
  saturatedFat: z.number().nullable(),
  transFat: z.number().nullable(),
  fiber: z.number().nullable(),
  sugar: z.number().nullable(),
  sodium: z.number().nullable(),
  cholesterol: z.number().nullable(),
  vitaminA: z.number().nullable(),
  vitaminC: z.number().nullable(),
  calcium: z.number().nullable(),
  iron: z.number().nullable(),
  status: z.nativeEnum(ServingStatus),
  dataSource: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const FoodResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  variant: z.string().nullable(),
  brand: z.string().nullable(),
  servings: z.array(ServingResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ServingResponseDto = z.infer<typeof ServingResponseSchema>;
export type FoodResponseDto = z.infer<typeof FoodResponseSchema>;
