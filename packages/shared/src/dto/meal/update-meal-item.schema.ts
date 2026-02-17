import { z } from 'zod';
import { AddMealItemSchema } from './add-meal-item.schema';

export const UpdateMealItemSchema = AddMealItemSchema.omit({ foodId: true, servingId: true }).partial();

export type UpdateMealItemDto = z.infer<typeof UpdateMealItemSchema>;
