import { z } from 'zod';

export const CreateFoodSchema = z.object({
  name: z.string().min(1).describe('Food name'),
  variant: z.string().optional().describe('Food variant (e.g., "Curly", "Waffle")'),
  brand: z.string().optional().describe('Brand name'),
});

export type CreateFoodDto = z.infer<typeof CreateFoodSchema>;
