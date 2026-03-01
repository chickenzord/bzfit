import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { DataProvider, NutritionDataContext, NutritionResult } from '../data-provider.interface';

// ---------------------------------------------------------------------------
// JSON schema OpenAI must return
// ---------------------------------------------------------------------------

// OpenAI strict mode requires every property to be listed in `required`.
// Optional fields use { type: ['number', 'null'] } instead of being omitted.
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    calories: { type: 'number', description: 'kcal' },
    protein: { type: 'number', description: 'grams' },
    carbs: { type: 'number', description: 'grams' },
    fat: { type: 'number', description: 'grams' },
    saturatedFat: { type: ['number', 'null'], description: 'grams, null if unknown' },
    transFat: { type: ['number', 'null'], description: 'grams, null if unknown' },
    fiber: { type: ['number', 'null'], description: 'grams, null if unknown' },
    sugar: { type: ['number', 'null'], description: 'grams, null if unknown' },
    sodium: { type: ['number', 'null'], description: 'milligrams, null if unknown' },
    cholesterol: { type: ['number', 'null'], description: 'milligrams, null if unknown' },
    confidence: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description: 'How confident you are in these estimates',
    },
    notes: {
      type: ['string', 'null'],
      description: 'Brief explanation of assumptions or caveats (max 120 chars), null if none',
    },
  },
  required: ['calories', 'protein', 'carbs', 'fat', 'saturatedFat', 'transFat', 'fiber', 'sugar', 'sodium', 'cholesterol', 'confidence', 'notes'],
  additionalProperties: false,
} as const;

interface OpenAiNutritionResponse {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat?: number;
  transFat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  confidence: 'low' | 'medium' | 'high';
  notes?: string;
}

// ---------------------------------------------------------------------------

@Injectable()
export class OpenAiProvider implements DataProvider {
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly client: OpenAI | null;
  private readonly model: string;

  readonly name = 'openai';
  readonly displayName = 'AI Estimation (OpenAI)';
  readonly dataType = 'nutrition' as const;
  readonly kind = 'estimation' as const;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async fetch(context: NutritionDataContext): Promise<NutritionResult[]> {
    if (!this.client) {
      throw new Error('OpenAI provider is not configured (missing OPENAI_API_KEY).');
    }

    const prompt = this.buildPrompt(context);
    this.logger.debug(`Estimating nutrition via OpenAI (${this.model})`);

    let parsed: OpenAiNutritionResponse;
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a nutrition expert. Estimate nutrition facts for the food described by the user. ' +
              'Values must be for the exact serving size specified — do NOT return per-100g values. ' +
              'Be honest about uncertainty and set confidence accordingly.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'nutrition_estimate',
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');
      parsed = JSON.parse(content) as OpenAiNutritionResponse;
    } catch (err) {
      this.logger.error(`OpenAI request failed: ${(err as Error).message}`);
      throw new Error('AI estimation failed. Please try again later.');
    }

    const sourceLabel = parsed.notes
      ? `AI Estimate — ${parsed.notes}`
      : 'AI Estimate (OpenAI)';

    return [
      {
        dataKind: 'estimated',
        confidence: parsed.confidence,
        sourceLabel,
        // Values are already for the exact requested serving — no scaling needed.
        // Nulls from the schema are stripped so downstream validation sees only numbers.
        calories: parsed.calories,
        protein: parsed.protein,
        carbs: parsed.carbs,
        fat: parsed.fat,
        ...(parsed.saturatedFat != null && { saturatedFat: parsed.saturatedFat }),
        ...(parsed.transFat != null && { transFat: parsed.transFat }),
        ...(parsed.fiber != null && { fiber: parsed.fiber }),
        ...(parsed.sugar != null && { sugar: parsed.sugar }),
        ...(parsed.sodium != null && { sodium: parsed.sodium }),
        ...(parsed.cholesterol != null && { cholesterol: parsed.cholesterol }),
      },
    ];
  }

  // ---------------------------------------------------------------------------

  private buildPrompt(ctx: NutritionDataContext): string {
    const lines: string[] = [];

    lines.push(`Food: ${ctx.foodName}`);
    if (ctx.foodBrand) lines.push(`Brand: ${ctx.foodBrand}`);
    if (ctx.foodVariant) lines.push(`Variant: ${ctx.foodVariant}`);
    if (ctx.servingName) lines.push(`Serving name: ${ctx.servingName}`);
    lines.push(`Serving size: ${ctx.servingSize} ${ctx.servingUnit}`);
    if (ctx.extraContext) lines.push(`Additional context: ${ctx.extraContext}`);

    return lines.join('\n');
  }
}
