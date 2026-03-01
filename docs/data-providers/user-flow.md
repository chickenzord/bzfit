# User Flow

All provider kinds follow the same three-step pattern: **import → review → verify**. The differences are in labeling, the optional extra context field, and whether a results picker is needed.

---

## Path A — Estimation provider (AI/LLM)

Returns exactly one result. No results picker needed.

```
[NEEDS REVIEW screen]
User sees a serving with no nutrition data
User taps "Get Nutrition Data"
        │
        ▼
[Provider picker — only shown if >1 provider is available]
User selects "OpenAI" (labeled "Estimate with AI")

  ┌─────────────────────────────────────────┐
  │ Extra context (optional)                │
  │ e.g. "grilled, no skin, oil on side"   │
  └─────────────────────────────────────────┘

User taps "Estimate"
        │
        ▼
Loading: "Estimating nutrition values…"
        │
        ▼
POST /catalog/servings/:id/nutrition-import
  body: { provider: "openai", extraContext: "grilled, no skin, oil on side" }
  → { results: [{ dataKind: "estimated", confidence: "high", calories: 165, ... }] }
        │
        ▼
[Review screen]
Banner: "⚠ Estimated by OpenAI — values are AI-inferred, not measured"
Form pre-filled with the single estimated result
User can edit any field
        │
        ▼
User taps "Apply Estimate"
POST /catalog/servings/:id/apply-nutrition
  → nutrition fields updated, dataSource = "Estimated by OpenAI"
  → status remains NEEDS_REVIEW
        │
        ▼
User reviews the applied values, taps "Verify"
POST /catalog/servings/:id/verify  →  status = VERIFIED
```

---

## Path B — Lookup provider, single result

When the provider returns exactly one match, the results picker is skipped.

```
[NEEDS REVIEW screen]
User taps "Get Nutrition Data"

[Provider picker]
User selects "FatSecret" (labeled "Look up in FatSecret")

  ┌─────────────────────────────────────────┐
  │ Extra context (optional)                │
  │ e.g. "roasted, skinless"               │
  └─────────────────────────────────────────┘

User taps "Search"
        │
        ▼
Loading: "Searching FatSecret…"
        │
        ▼
POST /catalog/servings/:id/nutrition-import
  body: { provider: "fatsecret", extraContext: "roasted, skinless" }
  → { results: [{ dataKind: "measured", resultServingSize: 100, resultServingUnit: "g",
                  sourceLabel: "FatSecret — Chicken Breast, Grilled (USDA SR28)", ... }] }
        │
        ▼
[Review screen]
Banner: "✓ Imported from FatSecret — Chicken Breast, Grilled (USDA SR28)"
Note:   "Values were scaled from 100g to match your serving of 50g."
Form pre-filled with auto-scaled values
User can still edit any field
        │
        ▼
User taps "Apply Import"
POST /catalog/servings/:id/apply-nutrition
  → nutrition fields updated (auto-scaled)
  → dataSource = "FatSecret — USDA SR28 (scaled from 100g to 50g)"
  → status remains NEEDS_REVIEW
        │
        ▼
User taps "Verify"
POST /catalog/servings/:id/verify  →  status = VERIFIED
```

---

## Path C — Lookup provider, multiple results

When the provider returns more than one candidate, the user picks before reviewing.
Each row shows `resultServingSize` so the user can factor in serving size match before picking.

```
[NEEDS REVIEW screen]
User taps "Get Nutrition Data"

[Provider picker]
User selects "Open Food Data" (labeled "Look up in Open Food Data")

  ┌─────────────────────────────────────────┐
  │ Extra context (optional)                │
  │ e.g. "grilled, no breading"            │
  └─────────────────────────────────────────┘

User taps "Search"
        │
        ▼
Loading: "Searching Open Food Data…"
        │
        ▼
POST /catalog/servings/:id/nutrition-import
  body: { provider: "open-food-data", extraContext: "grilled, no breading" }
  → { results: [
        { sourceLabel: "Open Food Facts — Chicken Breast, Grilled, Skinless (USDA SR28)",
          resultServingSize: 100, resultServingUnit: "g", calories: 165, ... },
        { sourceLabel: "Open Food Facts — Chicken Breast, Roasted (Brand X)",
          resultServingSize: 100, resultServingUnit: "g", calories: 172, ... },
        { sourceLabel: "Open Food Facts — Chicken Breast, Breaded (Brand Y)",
          resultServingSize: 85,  resultServingUnit: "g", calories: 230, ... }
      ] }
        │
        ▼
[Results picker screen]
Each row: sourceLabel + key macros + serving size
  e.g. "per 100g · 165 kcal · P 31g · C 0g · F 3.6g"
User taps the best match
        │
        ▼
[Review screen]
Banner: "✓ Imported from Open Food Facts — Chicken Breast, Grilled, Skinless (USDA SR28)"
Note:   "Values were scaled from 100g to match your serving of 50g."
Form pre-filled with auto-scaled values
User can still edit any field
        │
        ▼
User taps "Apply Import"
POST /catalog/servings/:id/apply-nutrition
  → nutrition fields updated, dataSource = "Open Food Facts — USDA SR28 (scaled from 100g to 50g)"
  → status remains NEEDS_REVIEW
        │
        ▼
User taps "Verify"
POST /catalog/servings/:id/verify  →  status = VERIFIED
```

---

## UX Summary

| | Estimation (AI) | Lookup (database) |
|---|---|---|
| Button label | "Estimate with AI" | "Look up in [Provider]" |
| Extra context field | Yes — shown on picker screen | Yes — shown on picker screen |
| Trigger button label | "Estimate" | "Search" |
| Loading message | "Estimating…" | "Searching…" |
| Result count | Always 1 | 1 or many |
| Results picker screen | Never | Only when results > 1 |
| Picker row shows serving size | N/A | Yes |
| Review banner tone | Warning — values are inferred | Confirmation — values are measured |
| Scaling note on review screen | Never | When `resultServingSize` differs from stored serving |
| Apply button label | "Apply Estimate" | "Apply Import" |
| `dataSource` value | `"Estimated by OpenAI"` | `"FatSecret — USDA SR28 (scaled from 100g to 50g)"` |
