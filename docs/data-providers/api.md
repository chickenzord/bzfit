# API Reference

## Endpoints

### List providers

```
GET /api/v1/catalog/providers
```

Returns all registered providers and their availability. Used by the UI to populate the provider picker.

```json
{
  "providers": [
    { "name": "openai",    "displayName": "OpenAI",    "dataType": "nutrition", "kind": "estimation", "available": true  },
    { "name": "anthropic", "displayName": "Anthropic", "dataType": "nutrition", "kind": "estimation", "available": false },
    { "name": "fatsecret", "displayName": "FatSecret", "dataType": "nutrition", "kind": "lookup",     "available": false }
  ]
}
```

---

### Import data for a serving

```
POST /api/v1/catalog/servings/:id/nutrition-import
```

**Body:**

```json
{
  "provider": "openai",
  "extraContext": "grilled with olive oil, no skin — label says 4.2g fat per 100g"
}
```

| Field | Required | Description |
|---|---|---|
| `provider` | No | Provider name; defaults to first available nutrition provider |
| `extraContext` | No | Free-text hint to improve accuracy; passed through to the provider as-is |

Does **not** modify the serving — only returns results for user review.

Always returns an array. Estimation providers return one item; lookup providers may return several ranked candidates. `resultServingSize` / `resultServingUnit` are included when the result's serving differs from the stored one.

**Response — estimation provider:**

```json
{
  "provider": "openai",
  "providerKind": "estimation",
  "providerDataType": "nutrition",
  "results": [
    {
      "calories": 165,
      "protein": 31,
      "carbs": 0,
      "fat": 3.6,
      "dataKind": "estimated",
      "confidence": "high",
      "sourceLabel": "AI estimation based on food name and serving size"
    }
  ]
}
```

**Response — lookup provider (multiple candidates):**

```json
{
  "provider": "open-food-data",
  "providerKind": "lookup",
  "providerDataType": "nutrition",
  "results": [
    {
      "calories": 165,
      "protein": 31,
      "carbs": 0,
      "fat": 3.6,
      "dataKind": "measured",
      "sourceLabel": "Open Food Facts — Chicken Breast, Grilled, Skinless (USDA SR28)",
      "resultServingSize": 100,
      "resultServingUnit": "g"
    },
    {
      "calories": 172,
      "protein": 30,
      "carbs": 0,
      "fat": 4.5,
      "dataKind": "measured",
      "sourceLabel": "Open Food Facts — Chicken Breast, Roasted (Brand X)",
      "resultServingSize": 100,
      "resultServingUnit": "g"
    }
  ]
}
```

---

### Apply imported data to a serving

```
POST /api/v1/catalog/servings/:id/apply-nutrition
```

**Body:** nutrition fields (same shape as `UpdateServingDto`) plus optional `dataSource`.

- If the chosen result had `resultServingSize` / `resultServingUnit` and units are compatible, the backend **auto-scales** all values to match the stored serving size before writing.
- Sets `dataSource` to a human-readable string identifying the provider, source, and any scaling applied — e.g. `"Estimated by OpenAI"`, `"FatSecret — USDA SR28"`, or `"FatSecret — USDA SR28 (scaled from 100g to 50g)"`.
- Does **not** change `status` — the serving stays `NEEDS_REVIEW` until the user explicitly verifies.

---

### Verify a serving

```
POST /api/v1/catalog/servings/:id/verify
```

Promotes the serving to `status = VERIFIED`. Unchanged from the existing flow — the import system does not modify this endpoint.

---

## Shared DTOs

Add to `packages/shared/src/dto/common/nutrition-import.schema.ts`:

```typescript
export const NutritionImportRequestSchema = z.object({
  provider:     z.string().optional(),
  extraContext: z.string().optional(),
});

export const NutritionResultSchema = z.object({
  calories:          z.number().optional(),
  protein:           z.number().optional(),
  carbs:             z.number().optional(),
  fat:               z.number().optional(),
  saturatedFat:      z.number().optional(),
  transFat:          z.number().optional(),
  fiber:             z.number().optional(),
  sugar:             z.number().optional(),
  sodium:            z.number().optional(),
  cholesterol:       z.number().optional(),
  dataKind:          z.enum(['estimated', 'measured']),
  confidence:        z.enum(['low', 'medium', 'high']).optional(),
  sourceLabel:       z.string().optional(),
  /** Serving size the returned values apply to; omit when it matches the requested serving exactly. */
  resultServingSize: z.number().optional(),
  resultServingUnit: z.string().optional(),
});

export const NutritionImportResponseSchema = z.object({
  provider:         z.string(),
  providerKind:     z.enum(['estimation', 'lookup']),
  providerDataType: z.enum(['nutrition', 'workout']),
  results:          z.array(NutritionResultSchema),
});

export type NutritionImportRequestDto  = z.infer<typeof NutritionImportRequestSchema>;
export type NutritionResultDto         = z.infer<typeof NutritionResultSchema>;
export type NutritionImportResponseDto = z.infer<typeof NutritionImportResponseSchema>;
```

---

## Backend Data Flow

```
ServingsController receives POST /catalog/servings/:id/nutrition-import
  body: { provider?, extraContext? }
        │
        ▼
Load serving + food from DB → build NutritionDataContext
  (merges extraContext from request body)
        │
        ▼
DataProviderRegistry.get(provider) — or getDefault('nutrition') if omitted
        │
        ▼
provider.fetch(context)
  estimation: calls OpenAI / Anthropic with structured output
  lookup:     queries FatSecret / Open Food Facts
        │
        ▼
NutritionResult[]  (1 item for estimation; 1–N for lookup)
        │
        ▼
Return NutritionImportResponseDto — no DB write yet

─ ─ ─ ─ ─ ─ ─ ─ (user reviews / picks result in app) ─ ─ ─ ─ ─ ─ ─ ─

ServingsController receives POST /catalog/servings/:id/apply-nutrition
  body: { calories, protein, ..., dataSource? }
        │
        ▼
ServingsService.applyNutrition(id, data)
  if resultServingSize present and units compatible → auto-scale values
  write nutrition fields + dataSource to DB
  status stays NEEDS_REVIEW
        │
        ▼
Return updated ServingResponseDto

─ ─ ─ ─ ─ ─ ─ ─ (user taps Verify) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

ServingsController receives POST /catalog/servings/:id/verify
        │
        ▼
ServingsService.verifyServing(id)  →  status = VERIFIED
```
