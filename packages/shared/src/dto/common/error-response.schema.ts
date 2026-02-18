import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  statusCode: z.number().describe('HTTP status code'),
  message: z.union([z.string(), z.array(z.string())]).describe('Error message or array of validation errors'),
  error: z.string().describe('Error type identifier'),
  timestamp: z.string().describe('ISO 8601 timestamp of when the error occurred'),
  path: z.string().describe('Request path that caused the error'),
});

export const ValidationErrorSchema = z.object({
  field: z.string().describe('Field that failed validation'),
  constraint: z.string().describe('Validation constraint that failed'),
  message: z.string().describe('Error message'),
});

export type ErrorResponseDto = z.infer<typeof ErrorResponseSchema>;
export type ValidationErrorDto = z.infer<typeof ValidationErrorSchema>;
