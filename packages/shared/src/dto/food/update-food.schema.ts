import { z } from 'zod';
import { CreateFoodSchema } from './create-food.schema';

export const UpdateFoodSchema = CreateFoodSchema.partial();

export type UpdateFoodDto = z.infer<typeof UpdateFoodSchema>;
