# Caching & Invalidation Strategy (Card #108)

## Problem

The app uses TanStack Query for server state. Cache keys are defined in
`lib/query-keys.ts` but invalidation is scattered across individual screens
and components, written ad-hoc. This causes two classes of bugs:

### 1. Cross-domain staleness
Mutating a serving in the **Catalog** screen invalidates `["foods"]` and
`["meals"]` but the **Journal** view fetches `["meals", "daily-summary", date]`
— a more specific key. Because TanStack Query's invalidation is prefix-based,
`["meals"]` *does* match `["meals", "daily-summary", date]`, but only if the
string `"meals"` is used consistently. The current code mixes raw strings
(`["meals"]`, `["meals", "dates"]`) and typed keys (`queryKeys.dailySummary()`)
making this fragile and easy to break.

### 2. Inconsistent invalidation scope
When a serving is updated (nutrition data changed), the following caches are
affected but not all are invalidated everywhere:

| Cache | Affected by serving update | Currently invalidated |
|---|---|---|
| `["foods"]` | ✅ | ✅ in some places |
| `["foods", id]` | ✅ | ✅ in some places |
| `["foods", "needs-review"]` | ✅ | ❌ not always |
| `["meals", "daily-summary", *]` | ✅ (nutrition values change) | ❌ not always |
| `["meals", "dates", *, *]` | ⚠️ (indirectly) | ❌ inconsistent |

---

## Root Cause

Invalidation logic lives **inside components** rather than in a central place.
Each screen/component decides what to invalidate after a mutation. When a new
query key is added or a mutation gains a new side effect, every callsite needs
to be updated — and they inevitably drift.

---

## Solution: Centralised Mutation Hooks with Declared Invalidation

### Principle

Move all mutations out of components and into typed hooks in `lib/`.
Each hook owns its invalidation logic. Components just call the hook.

```
Component → calls hook → mutation succeeds → hook invalidates all affected keys
```

No component ever calls `invalidateQueries` directly.

### Step 1 — Fix query key hierarchy

All meal-related keys must share a common root so prefix invalidation works
reliably. Extend `lib/query-keys.ts`:

```ts
export const queryKeys = {
  // Catalog — all share ["catalog"] root
  catalog: () => ["catalog"] as const,
  foods: () => ["catalog", "foods"] as const,
  needsReview: () => ["catalog", "foods", "needs-review"] as const,
  food: (id: string) => ["catalog", "foods", id] as const,
  foodSearch: (q: string) => ["catalog", "foods", "search", q] as const,
  serving: (id: string) => ["catalog", "servings", id] as const,

  // Nutrition — all share ["nutrition"] root
  nutrition: () => ["nutrition"] as const,
  dailySummary: (date: string) => ["nutrition", "daily-summary", date] as const,
  mealDates: (from: string, to: string) => ["nutrition", "dates", from, to] as const,

  // Goals
  goals: () => ["goals"] as const,
  currentGoal: () => ["goals", "current"] as const,
  allGoals: () => ["goals", "all"] as const,

  // Auth
  apiKeys: () => ["api-keys"] as const,
};
```

**Why this matters:** invalidating `queryKeys.catalog()` now reliably clears
all foods, searches, and servings in one call. Invalidating `queryKeys.nutrition()`
clears all meal summaries and date ranges.

### Step 2 — Define invalidation groups

Document which mutations affect which cache domains:

| Mutation | Invalidates |
|---|---|
| Update food name/brand | `catalog.foods()`, `catalog.food(id)` |
| Update serving nutrition | `catalog.foods()`, `catalog.food(foodId)`, `catalog.serving(id)`, `catalog.needsReview()`, `nutrition()` |
| Update serving status | same as above |
| Delete food | `catalog()`, `nutrition()` |
| Add meal item | `nutrition.dailySummary(date)`, `nutrition.mealDates()` |
| Delete meal item | `nutrition.dailySummary(date)`, `nutrition.mealDates()` |
| Quick-add (new food + meal item) | `catalog.foods()`, `nutrition.dailySummary(date)`, `nutrition.mealDates()` |

### Step 3 — Create centralised mutation hooks in `lib/catalog.ts`

Extract all catalog mutations from components into a single file:

```ts
// lib/catalog.ts

export function useUpdateServing(servingId: string, foodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateServingDto) => apiFetch(`/catalog/servings/${servingId}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      // All places that care about serving changes invalidated in one place
      queryClient.invalidateQueries({ queryKey: queryKeys.foods() });
      queryClient.invalidateQueries({ queryKey: queryKeys.food(foodId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.serving(servingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.needsReview() });
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition() });
    },
  });
}

export function useDeleteFood(foodId: string) { ... }
export function useUpdateFood(foodId: string) { ... }
```

Meal mutations already live in `lib/nutrition.ts` — extend the same pattern there.

### Step 4 — Remove inline invalidation from components

Replace every `invalidateQueries` call in components with the appropriate hook.
Components become:

```tsx
// Before
const queryClient = useQueryClient();
const save = async () => {
  await apiFetch(`/catalog/servings/${id}`, { method: 'PATCH', body: data });
  queryClient.invalidateQueries({ queryKey: queryKeys.foods() });
  queryClient.invalidateQueries({ queryKey: ["meals"] }); // raw string, fragile
};

// After
const updateServing = useUpdateServing(id, foodId);
const save = () => updateServing.mutate(data);
```

---

## Files to change

| File | Change |
|---|---|
| `lib/query-keys.ts` | Add `catalog()` and `nutrition()` root keys; rename existing keys to use new hierarchy |
| `lib/catalog.ts` | New file — all catalog mutations with declared invalidation |
| `lib/nutrition.ts` | Existing mutations updated to use new key hierarchy |
| `app/(tabs)/catalog/foods/[id]/edit.tsx` | Use `useUpdateFood`, `useUpdateServing` hooks |
| `app/(tabs)/catalog/foods/[id]/index.tsx` | Use `useDeleteFood` hook |
| `app/(tabs)/catalog/servings/[id].tsx` | Use `useUpdateServing` hook |
| `components/journal/MealDetailModal.tsx` | Use hooks from `lib/nutrition.ts` |
| `components/journal/QuickAddModal.tsx` | Use hooks from `lib/nutrition.ts` + `lib/catalog.ts` |

---

## Cross-domain invalidation

This is the core of the original bug report and deserves explicit treatment.

### Why serving changes affect the nutrition domain

The `GET /nutrition/daily-summary` response is a **fully denormalized snapshot**
computed at query time. It embeds into each `MealItem`:

- The full `food` object (name, variant, brand)
- The full `serving` object (all nutrition values + status)
- A pre-computed `nutrition` object (`serving.calories × quantity`)
- Aggregated `totals` per meal and for the whole day

None of this is stored — it is joined and computed fresh on every request.
The client cache holds a snapshot of what those values were at fetch time.

This means: if a serving's nutrition data changes in the catalog, the cached
daily summary immediately becomes wrong — it still holds the old
`serving.calories`, the old per-item `nutrition`, and the old day `totals`.
The client cannot recompute this locally because the calculation lives on the
server. **The only fix is to refetch.**

Importantly, `setQueryData` (optimistic update) is not viable here for the same
reason — the client doesn't have enough information to recompute the aggregated
totals correctly without a round-trip.

### How the new key hierarchy handles it

Because `queryKeys.dailySummary(date)` is `["nutrition", "daily-summary", date]`
and `queryKeys.nutrition()` is `["nutrition"]`, a single call:

```ts
queryClient.invalidateQueries({ queryKey: queryKeys.nutrition() })
```

cascades to **all** nutrition queries — every daily summary for every date,
every meal date range — in one shot. No need to know which dates are currently
in the cache.

This only works because of the hierarchical key structure in Step 1. With the
old flat keys (`["meals", "daily-summary", date]` and `["meals"]` mixed with
`["meals", "dates", ...]`), a blanket invalidate of `["meals"]` *accidentally*
worked for some cases but was never deliberate and would silently break if any
key drifted.

### The cross-domain rule

> Any mutation in the **catalog** domain that changes nutrition values
> (serving calories, protein, carbs, fat, etc.) or status **must** also
> invalidate `queryKeys.nutrition()`.

Mutations that change only metadata (food name, brand, serving unit/size label)
do **not** need to invalidate nutrition — the displayed values are unchanged.

| Catalog mutation | Invalidate nutrition? | Reason |
|---|---|---|
| Update serving calories/macros | ✅ Yes | Displayed totals change |
| Update serving status (NEEDS_REVIEW → VERIFIED) | ✅ Yes | Warning icon state changes in Journal |
| Update food name / brand | ❌ No | Doesn't affect displayed nutrition values |
| Update serving size label / unit | ❌ No | Cosmetic only |
| Delete food (with force) | ✅ Yes | Meal items removed, daily totals change |

This table lives in `lib/catalog.ts` as a comment block above each hook so
the intent is always co-located with the invalidation code.

---

## Out of scope

- Optimistic updates (nice to have later, but correctness first)
- Background refetch tuning (`staleTime`, `gcTime`) — separate concern
- Pagination / infinite scroll for the food catalog — separate card
