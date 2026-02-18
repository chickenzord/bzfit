import { z } from 'zod';
import { MealType } from '../../entities';
import { AddMealItemSchema } from './add-meal-item.schema';

export const CreateMealSchema = z.object({
  date: z.string().date().describe('Date of the meal (ISO 8601 date format)'),
  mealType: z.nativeEnum(MealType).describe('Type of meal'),
  notes: z.string().optional().describe('Optional notes about the meal'),
  items: z.array(AddMealItemSchema).optional().describe('Initial meal items to add'),
});

export type CreateMealDto = z.infer<typeof CreateMealSchema>;
