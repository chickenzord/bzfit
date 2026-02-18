import { z } from 'zod';

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).describe('Descriptive name for the API key'),
  scopes: z.array(z.string()).describe('Array of permission scopes'),
  expiresAt: z.string().datetime({ offset: true }).optional().describe('Optional expiration date (ISO 8601 format)'),
});

export type CreateApiKeyDto = z.infer<typeof CreateApiKeySchema>;
