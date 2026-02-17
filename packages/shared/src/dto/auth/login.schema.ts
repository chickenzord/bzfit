import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email().describe('User email address'),
  password: z.string().min(1).describe('User password'),
});

export type LoginDto = z.infer<typeof LoginSchema>;
