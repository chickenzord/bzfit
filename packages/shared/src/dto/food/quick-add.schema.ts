import { z } from 'zod';
import { MealType } from '../../entities';
import { CreateFoodSchema } from './create-food.schema';

export const QuickAddSchema = z.object({
  food: CreateFoodSchema.describe('Food details'),
  servingSize: z.number().min(0).describe('Serving size (numeric value)'),
  servingUnit: z.string().min(1).describe('Serving unit (e.g., "g", "ml", "oz", "cup")'),
  quantity: z.number().min(0).optional().describe('Quantity multiplier for the meal item'),
  mealType: z.nativeEnum(MealType).describe('Meal type to log this food to'),
  date: z.string().date().describe('Date for the meal (ISO 8601 date format)'),
  notes: z.string().optional().describe('Optional notes for the meal item'),
});

export type QuickAddDto = z.infer<typeof QuickAddSchema>;
