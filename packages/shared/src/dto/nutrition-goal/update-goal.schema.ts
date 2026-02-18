import { z } from 'zod';
import { CreateGoalSchema } from './create-goal.schema';

export const UpdateGoalSchema = CreateGoalSchema.partial();

export type UpdateGoalDto = z.infer<typeof UpdateGoalSchema>;
