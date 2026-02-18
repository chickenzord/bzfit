import { z } from 'zod';

export const MacroProgressSchema = z.object({
  target: z.number().nullable().describe('Target value'),
  actual: z.number().describe('Actual value consumed'),
  percentage: z.number().nullable().describe('Percentage of target achieved'),
});

export const NutritionGoalProgressSchema = z.object({
  calories: MacroProgressSchema.describe('Calories progress'),
  protein: MacroProgressSchema.describe('Protein progress'),
  carbs: MacroProgressSchema.describe('Carbs progress'),
  fat: MacroProgressSchema.describe('Fat progress'),
});

export type MacroProgressDto = z.infer<typeof MacroProgressSchema>;
export type NutritionGoalProgressDto = z.infer<typeof NutritionGoalProgressSchema>;
