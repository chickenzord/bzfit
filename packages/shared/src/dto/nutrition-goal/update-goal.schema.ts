import { z } from 'zod';
import { GoalTargetsSchema } from './create-goal.schema';

export const UpdateGoalSchema = GoalTargetsSchema.partial();

export type UpdateGoalDto = z.infer<typeof UpdateGoalSchema>;
