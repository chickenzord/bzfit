import { z } from 'zod';

export const AddMealItemSchema = z.object({
  foodId: z.string().uuid().describe('Food ID'),
  servingId: z.string().uuid().describe('Serving ID'),
  quantity: z.number().min(0).optional().describe('Quantity multiplier (e.g., 1.5 for 1.5 servings)'),
  notes: z.string().optional().describe('Optional notes for this item'),
  isEstimated: z.boolean().optional().describe('Mark this item as estimated (no exact nutrition data)'),
});

export type AddMealItemDto = z.infer<typeof AddMealItemSchema>;
