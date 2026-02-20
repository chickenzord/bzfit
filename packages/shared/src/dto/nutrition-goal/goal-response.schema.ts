import { z } from 'zod';

export const GoalResponseSchema = z.object({
  id: z.string().describe('Goal ID'),
  userId: z.string().describe('User ID'),
  caloriesTarget: z.number().nullable().describe('Daily calorie target (kcal)'),
  proteinTarget: z.number().nullable().describe('Daily protein target (grams)'),
  carbsTarget: z.number().nullable().describe('Daily carbs target (grams)'),
  fatTarget: z.number().nullable().describe('Daily fat target (grams)'),
  fiberTarget: z.number().nullable().describe('Daily fiber target (grams)'),
  sugarTarget: z.number().nullable().describe('Maximum daily sugar (grams)'),
  sodiumTarget: z.number().nullable().describe('Maximum daily sodium (mg)'),
  startDate: z.string().describe('Goal start date (ISO 8601)'),
  endDate: z.string().nullable().describe('Goal end date (null = ongoing)'),
  isLatest: z.boolean().describe('Whether this is the latest (most recent) goal'),
  createdAt: z.string().describe('Created timestamp'),
  updatedAt: z.string().describe('Last updated timestamp'),
});

export type GoalResponseDto = z.infer<typeof GoalResponseSchema>;
