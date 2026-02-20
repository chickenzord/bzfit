import { z } from 'zod';

export const GoalTargetsSchema = z.object({
  caloriesTarget: z.number().min(0).optional().describe('Daily calorie target (kcal)'),
  proteinTarget: z.number().min(0).optional().describe('Daily protein target (grams)'),
  carbsTarget: z.number().min(0).optional().describe('Daily carbs target (grams)'),
  fatTarget: z.number().min(0).optional().describe('Daily fat target (grams)'),
  fiberTarget: z.number().min(0).optional().describe('Daily fiber target (grams)'),
  sugarTarget: z.number().min(0).optional().describe('Maximum daily sugar (grams)'),
  sodiumTarget: z.number().min(0).optional().describe('Maximum daily sodium (mg)'),
});

export const CreateGoalSchema = GoalTargetsSchema.extend({
  startDate: z.string().date().optional().describe('Goal start date (YYYY-MM-DD, defaults to today)'),
});

export type CreateGoalDto = z.infer<typeof CreateGoalSchema>;
