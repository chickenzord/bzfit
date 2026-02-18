import { z } from 'zod';
import { CreateServingSchema } from './create-serving.schema';

export const UpdateServingSchema = CreateServingSchema.omit({ foodId: true }).partial();

export type UpdateServingDto = z.infer<typeof UpdateServingSchema>;
