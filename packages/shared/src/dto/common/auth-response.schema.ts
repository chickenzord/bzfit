import { z } from 'zod';

export const AuthResponseSchema = z.object({
  accessToken: z.string().describe('JWT access token'),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().optional(),
  }).describe('User information'),
});

export const ApiKeyResponseSchema = z.object({
  id: z.string().describe('API key ID'),
  key: z.string().describe('The generated API key (only shown once)'),
  name: z.string().describe('API key name'),
  scopes: z.array(z.string()).describe('Permission scopes'),
  expiresAt: z.string().optional().describe('Expiration date'),
});

export type AuthResponseDto = z.infer<typeof AuthResponseSchema>;
export type ApiKeyResponseDto = z.infer<typeof ApiKeyResponseSchema>;
