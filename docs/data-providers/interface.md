# Interface & Registry

## Core Interface

```typescript
// packages/server/src/modules/catalog/providers/data-provider.interface.ts

export interface NutritionDataContext {
  foodName: string;
  foodBrand?: string | null;
  foodVariant?: string | null;
  servingName?: string | null;
  servingSize: number;
  servingUnit: string;
  /**
   * Optional free-text context supplied by the user to improve provider accuracy.
   * AI providers weave this into their prompt; lookup providers may use it to
   * refine search terms or ignore it entirely.
   * Example: "grilled with olive oil, no skin", "label says 4.2g fat per 100g"
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
  sodium?: number;
  cholesterol?: number;
  /**
   * 'estimated' — values are AI-inferred; user should treat as a starting point.
   * 'measured'  — values come from a verified food database; generally more reliable.
   */
  dataKind: 'estimated' | 'measured';
  /** Confidence applicable to estimated results; omit or null for measured results. */
  confidence?: 'low' | 'medium' | 'high';
  /** Source description, e.g. "USDA SR28 — Chicken Breast, Grilled, Skinless" */
  sourceLabel?: string;
  /**
   * The serving size this result's nutrition values actually apply to.
   * May differ from the requested servingSize in NutritionDataContext.
   * Omit only when the provider is certain the values match the requested serving exactly
   * (e.g. estimation providers that were explicitly given the target size).
   * See the "Serving Size Mismatch" section below for downstream handling.
   */
  resultServingSize?: number;
  resultServingUnit?: string;
}

export interface DataProvider {
  /** Machine-readable key, e.g. "openai", "fatsecret" */
  readonly name: string;
  /** Human-readable label shown in the UI, e.g. "OpenAI" or "FatSecret" */
  readonly displayName: string;
  /**
   * What kind of data this provider produces.
   * 'nutrition' — macros/micros for foods/servings
   * 'workout'   — exercise, sets, reps, duration (future)
   */
  readonly dataType: 'nutrition' | 'workout';
  /**
   * 'estimation' — AI/LLM-based inference.
   * 'lookup'     — queries a food database for measured records.
   */
  readonly kind: 'estimation' | 'lookup';
  /** Returns false when required env vars / credentials are missing. */
  isAvailable(): boolean;
  /**
   * Import data for the given context.
   * Always returns an array — lookup providers may return multiple candidates,
   * estimation providers typically return one item but the contract is uniform.
   * Results should be ordered by relevance (best match first).
   */
  fetch(context: NutritionDataContext): Promise<NutritionResult[]>;
}
```

Returning an array is the core design choice: lookup providers can return many similar records and the user picks the best match; estimation providers return a single-item array. The uniform return type keeps the controller and registry free of branching.

The `dataType` field scopes the provider to a domain — today only `'nutrition'` is used. The `kind` field drives UI labeling — the app shows "Estimated by OpenAI" vs "Imported from FatSecret" depending on which provider produced the result.

---

## Serving Size Mismatch

A lookup provider may return nutrition data that applies to a **different serving size** than the one stored on the serving record. For example:

- The serving is stored as `50g`, but FatSecret's closest match is per `100g`
- The serving is stored as `1 cup`, but the database result is per `240ml`

The `resultServingSize` and `resultServingUnit` fields on `NutritionResult` let providers declare what serving their data actually applies to. This is resolved at `apply-nutrition` time.

### Handling at apply time

| Scenario | Handling |
|---|---|
| `resultServingSize` omitted | Provider guarantees values match the requested serving; apply as-is |
| Same unit, different size (e.g. 50g requested, 100g result) | **Auto-scale** — multiply all values by `requestedSize / resultSize`. Record scaling in `dataSource`: `"FatSecret (scaled from 100g to 50g)"` |
| Different but compatible units (e.g. ml vs g for water) | Auto-scale if a safe conversion factor is known; otherwise treat as incompatible |
| Incompatible units (e.g. grams vs pieces) | **Do not auto-scale** — surface a warning in the review screen; user edits manually |

### UX impact

On the **results picker screen** (lookup providers with multiple candidates), `resultServingSize` and `resultServingUnit` are shown alongside key macros so the user can pick the best-matching candidate before reaching the review screen.

On the **review screen**, if auto-scaling was applied, a note appears beneath the banner:
> *"Values were scaled from 100g (FatSecret) to match your serving of 50g."*

If units are incompatible:
> *"⚠ This result applies to 1 piece — your serving is in grams. Please verify the values manually."*

### Estimation providers

AI providers receive the exact `servingSize` and `servingUnit` in the context and estimate for that size directly. `resultServingSize` should be omitted, which the backend treats as an exact match.

---

## File Structure

```
packages/server/src/modules/catalog/
└── providers/
    ├── data-provider.interface.ts        # Interface + shared types (above)
    ├── data-provider.registry.ts         # Registry service
    ├── providers.module.ts               # NestJS module; imports all implementations
    ├── providers.controller.ts           # GET /api/v1/catalog/providers
    └── implementations/
        ├── openai.provider.ts            # First implementation (Card #116)
        ├── anthropic.provider.ts
        └── fatsecret.provider.ts
```

All provider modules are imported exclusively by `providers.module.ts`. Nothing else in the catalog imports individual providers directly.

---

## Registry Service

The registry is the single point of access for all providers.

```typescript
// data-provider.registry.ts

@Injectable()
export class DataProviderRegistry {
  constructor(
    @Inject(DATA_PROVIDERS)
    private readonly providers: DataProvider[],
  ) {}

  getAll(): DataProvider[] {
    return this.providers;
  }

  getAvailable(): DataProvider[] {
    return this.providers.filter((p) => p.isAvailable());
  }

  get(name: string): DataProvider {
    const provider = this.providers.find((p) => p.name === name);
    if (!provider) throw new NotFoundException(`Provider "${name}" not found`);
    if (!provider.isAvailable()) throw new BadRequestException(`Provider "${name}" is not configured`);
    return provider;
  }

  getDefault(dataType: DataProvider['dataType'] = 'nutrition'): DataProvider {
    const available = this.getAvailable().filter((p) => p.dataType === dataType);
    if (available.length === 0) throw new ServiceUnavailableException(`No ${dataType} providers are configured`);
    return available[0];
  }
}
```

Providers are injected as an array via a multi-provider token (`DATA_PROVIDERS`), so adding a new one only requires one line in `providers.module.ts`.

---

## Adding a New Provider

1. Create `packages/server/src/modules/catalog/providers/implementations/myprovider.provider.ts`
2. Implement `DataProvider`
3. Add it to the `providers` array in `providers.module.ts`

No other files change.

```typescript
// providers.module.ts

const PROVIDER_TOKEN = 'DATA_PROVIDERS';

@Module({
  providers: [
    DataProviderRegistry,
    { provide: PROVIDER_TOKEN, useClass: OpenAiProvider,    multi: true },
    { provide: PROVIDER_TOKEN, useClass: AnthropicProvider, multi: true },
    { provide: PROVIDER_TOKEN, useClass: FatSecretProvider, multi: true },
    // add new providers here ↑
  ],
  exports: [DataProviderRegistry],
})
export class ProvidersModule {}
```

---

## Configuration

Each provider reads its own env vars via `ConfigService`. Missing config causes `isAvailable()` to return `false` — no errors at startup.

| Provider    | Required Env Vars                                | Optional |
|-------------|--------------------------------------------------|---------|
| `openai`    | `OPENAI_API_KEY`                                 | `OPENAI_MODEL` |
| `anthropic` | `ANTHROPIC_API_KEY`                              | `ANTHROPIC_MODEL` |
| `fatsecret` | `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET` | — |
