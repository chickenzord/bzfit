import { z } from 'zod';

export const CreateGoalSchema = z.object({
  caloriesTarget: z.number().min(0).optional().describe('Daily calorie target (kcal)'),
  proteinTarget: z.number().min(0).optional().describe('Daily protein target (grams)'),
  carbsTarget: z.number().min(0).optional().describe('Daily carbs target (grams)'),
  fatTarget: z.number().min(0).optional().describe('Daily fat target (grams)'),
  fiberTarget: z.number().min(0).optional().describe('Daily fiber target (grams)'),
  sugarTarget: z.number().min(0).optional().describe('Maximum daily sugar (grams)'),
  sodiumTarget: z.number().min(0).optional().describe('Maximum daily sodium (mg)'),
});

export type CreateGoalDto = z.infer<typeof CreateGoalSchema>;
