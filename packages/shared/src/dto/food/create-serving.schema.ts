import { z } from 'zod';
import { ServingStatus } from '../../entities';

export const CreateServingSchema = z.object({
  foodId: z.string().uuid().describe('Food ID this serving belongs to'),
  name: z.string().optional().describe('Serving name (e.g., "Small", "Medium", "Large")'),
  size: z.number().min(0).describe('Serving size (numeric value)'),
  unit: z.string().min(1).describe('Unit of measurement (e.g., "g", "ml", "oz", "cup")'),
  isDefault: z.boolean().optional().describe('Is this the default serving size for the food?'),
  calories: z.number().min(0).optional().describe('Calories (kcal)'),
  protein: z.number().min(0).optional().describe('Protein (g)'),
  carbs: z.number().min(0).optional().describe('Carbohydrates (g)'),
  fat: z.number().min(0).optional().describe('Fat (g)'),
  saturatedFat: z.number().min(0).optional().describe('Saturated fat (g)'),
  transFat: z.number().min(0).optional().describe('Trans fat (g)'),
  fiber: z.number().min(0).optional().describe('Fiber (g)'),
  sugar: z.number().min(0).optional().describe('Sugar (g)'),
  sodium: z.number().min(0).optional().describe('Sodium (mg)'),
  cholesterol: z.number().min(0).optional().describe('Cholesterol (mg)'),
  vitaminA: z.number().min(0).optional().describe('Vitamin A (μg)'),
  vitaminC: z.number().min(0).optional().describe('Vitamin C (mg)'),
  calcium: z.number().min(0).optional().describe('Calcium (mg)'),
  iron: z.number().min(0).optional().describe('Iron (mg)'),
  status: z.nativeEnum(ServingStatus).optional().describe('Serving status'),
  dataSource: z.string().optional().describe('Data source (e.g., "USDA", "manual", "user")'),
});

export type CreateServingDto = z.infer<typeof CreateServingSchema>;
