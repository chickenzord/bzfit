import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email().describe('User email address'),
  password: z.string().min(8).describe('User password (minimum 8 characters)'),
  name: z.string().optional().describe('User display name'),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
