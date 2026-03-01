import { z } from 'zod';

export const NutritionImportRequestSchema = z.object({
  provider: z.string().optional().describe('Provider name; defaults to first available nutrition provider'),
  extraContext: z
    .string()
    .optional()
    .describe(
      'Optional free-text hint to improve accuracy. E.g. "grilled with olive oil, no skin" or "label says 4.2g fat per 100g"',
    ),
});

export const NutritionResultSchema = z.object({
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  saturatedFat: z.number().optional(),
  transFat: z.number().optional(),
  fiber: z.number().optional(),
  sugar: z.number().optional(),
  sodium: z.number().optional(),
  cholesterol: z.number().optional(),
  /** 'estimated' = AI-inferred; 'measured' = verified food database */
  dataKind: z.enum(['estimated', 'measured']),
  /** Confidence level; applicable to estimated results only */
  confidence: z.enum(['low', 'medium', 'high']).optional(),
  /** Human-readable source label, e.g. "Open Food Facts — Chicken Breast (USDA)" */
  sourceLabel: z.string().optional(),
  /** Serving size that the returned nutrition values actually apply to.
   *  Omit when the provider guarantees values match the requested serving exactly. */
  resultServingSize: z.number().optional(),
  resultServingUnit: z.string().optional(),
});

export const NutritionImportResponseSchema = z.object({
  provider: z.string(),
  providerKind: z.enum(['estimation', 'lookup']),
  providerDataType: z.enum(['nutrition', 'workout']),
  results: z.array(NutritionResultSchema),
});

export const ApplyNutritionSchema = z.object({
  calories: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  saturatedFat: z.number().min(0).optional(),
  transFat: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  cholesterol: z.number().min(0).optional(),
  /** Serving size the submitted values apply to. If different from the stored serving and
   *  units are compatible, the backend will auto-scale all values before writing. */
  resultServingSize: z.number().optional(),
  resultServingUnit: z.string().optional(),
  /** Human-readable label identifying the provider and source */
  dataSource: z.string().optional(),
});

export type NutritionImportRequestDto = z.infer<typeof NutritionImportRequestSchema>;
export type NutritionResultDto = z.infer<typeof NutritionResultSchema>;
export type NutritionImportResponseDto = z.infer<typeof NutritionImportResponseSchema>;
export type ApplyNutritionDto = z.infer<typeof ApplyNutritionSchema>;
