import { Injectable, Logger } from '@nestjs/common';
import { DataProvider, NutritionDataContext, NutritionResult } from '../data-provider.interface';

/** Subset of the Open Food Facts product shape we care about */
interface OffProduct {
  product_name?: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    'saturated-fat_100g'?: number;
    'trans-fat_100g'?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    /** Stored in g per 100g — must be multiplied by 1000 to get mg */
    sodium_100g?: number;
    /** Stored in g per 100g — must be multiplied by 1000 to get mg */
    cholesterol_100g?: number;
  };
}

interface OffSearchResponse {
  count: number;
  products: OffProduct[];
}

const BASE_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const MAX_RESULTS = 5;
const /** Fields to fetch from the API — keep the response payload small */
  FIELDS = ['product_name', 'brands', 'nutriments'].join(',');

@Injectable()
export class OpenFoodFactsProvider implements DataProvider {
  private readonly logger = new Logger(OpenFoodFactsProvider.name);

  readonly name = 'open-food-facts';
  readonly displayName = 'Open Food Facts';
  readonly dataType = 'nutrition' as const;
  readonly kind = 'lookup' as const;

  /** Open Food Facts is a public API — no credentials required */
  isAvailable(): boolean {
    return true;
  }

  async fetch(context: NutritionDataContext): Promise<NutritionResult[]> {
    const query = this.buildQuery(context);

    const url = new URL(BASE_URL);
    url.searchParams.set('search_terms', query);
    url.searchParams.set('json', '1');
    url.searchParams.set('page_size', String(MAX_RESULTS));
    url.searchParams.set('fields', FIELDS);
    url.searchParams.set('lc', 'en');

    this.logger.debug(`Searching Open Food Facts: "${query}"`);

    let data: OffSearchResponse;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      let response: Response;
      try {
        response = await fetch(url.toString(), {
          headers: { 'User-Agent': 'BzFit/0.2.0 (support@akhy.dev)' },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      data = (await response.json()) as OffSearchResponse;
    } catch (err) {
      this.logger.error(`Open Food Facts request failed: ${(err as Error).message}`);
      throw new Error('Open Food Facts is temporarily unavailable. Please try again later.');
    }

    const products = data.products ?? [];
    this.logger.debug(`Got ${products.length} results (total count: ${data.count})`);

    return products
      .filter((p) => p.product_name && p.nutriments)
      .map((p) => this.mapProduct(p));
  }

  // ---------------------------------------------------------------------------

  private buildQuery(ctx: NutritionDataContext): string {
    return [ctx.foodName, ctx.foodBrand, ctx.foodVariant, ctx.extraContext]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private mapProduct(product: OffProduct): NutritionResult {
    const n = product.nutriments!;

    const labelParts = [product.product_name];
    if (product.brands) labelParts.push(`(${product.brands})`);
    const sourceLabel = `Open Food Facts — ${labelParts.join(' ')}`;

    return {
      dataKind: 'measured',
      sourceLabel,
      // All Open Food Facts nutriments are expressed per 100g
      resultServingSize: 100,
      resultServingUnit: 'g',
      calories: n['energy-kcal_100g'],
      protein: n['proteins_100g'],
      carbs: n['carbohydrates_100g'],
      fat: n['fat_100g'],
      saturatedFat: n['saturated-fat_100g'],
      transFat: n['trans-fat_100g'],
      fiber: n['fiber_100g'],
      sugar: n['sugars_100g'],
      // OFF stores sodium and cholesterol in g/100g; convert to mg
      sodium: n['sodium_100g'] != null ? round(n['sodium_100g']! * 1000) : undefined,
      cholesterol: n['cholesterol_100g'] != null ? round(n['cholesterol_100g']! * 1000) : undefined,
    };
  }
}

function round(value: number, decimals = 2): number {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}
