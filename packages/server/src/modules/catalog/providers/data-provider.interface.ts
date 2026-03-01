export interface NutritionDataContext {
  foodName: string;
  foodBrand?: string | null;
  foodVariant?: string | null;
  servingName?: string | null;
  servingSize: number;
  servingUnit: string;
  /**
   * Optional free-text hint from the user to improve accuracy.
   * AI providers weave this into their prompt; lookup providers may use it
   * to refine their search query, or ignore it.
   */
  extraContext?: string;
}

export interface NutritionResult {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  saturatedFat?: number;
  transFat?: number;
  fiber?: number;
  sugar?: number;
  /** Sodium in mg */
  sodium?: number;
  /** Cholesterol in mg */
  cholesterol?: number;
  /** 'estimated' = AI-inferred; 'measured' = verified food database */
  dataKind: 'estimated' | 'measured';
  /** Confidence level; applicable to estimated results only */
  confidence?: 'low' | 'medium' | 'high';
  /** Human-readable source label shown in the UI */
  sourceLabel?: string;
  /**
   * The serving size these nutrition values actually apply to.
   * Omit when the provider guarantees values match the requested serving exactly
   * (e.g. an AI provider that was given the exact target size).
   * When present and the unit matches the stored serving's unit, the backend
   * will auto-scale values proportionally at apply time.
   */
  resultServingSize?: number;
  resultServingUnit?: string;
}

export interface DataProvider {
  /** Machine-readable key, e.g. "open-food-facts", "openai" */
  readonly name: string;
  /** Human-readable label shown in the UI, e.g. "Open Food Facts" */
  readonly displayName: string;
  /**
   * What kind of data this provider produces.
   * 'nutrition' — macros/micros for foods/servings
   * 'workout'   — exercise data (future)
   */
  readonly dataType: 'nutrition' | 'workout';
  /**
   * 'estimation' — AI/LLM-based inference (single result, confidence score).
   * 'lookup'     — queries a food database for measured records (1-N results).
   */
  readonly kind: 'estimation' | 'lookup';
  /** Returns false when required credentials or config are missing. */
  isAvailable(): boolean;
  /**
   * Fetch data for the given context.
   * Always returns an array — lookup providers may return multiple candidates
   * ordered by relevance; estimation providers return a single-item array.
   */
  fetch(context: NutritionDataContext): Promise<NutritionResult[]>;
}

/** DI token for the multi-provider array */
export const DATA_PROVIDERS = 'DATA_PROVIDERS';
