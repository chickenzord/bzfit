# Decisions & Alternatives

Design decisions that were explicitly weighed. Each section states what was chosen and what was considered.

---

## A. Provider Interface Shape

**Chosen:** unified interface, single `fetch()` method.

#### Option A1 — Unified interface *(chosen)*

All providers implement the same interface. `kind` on the provider tells the UI how to label results. The array return type handles both single-result (estimation) and multi-result (lookup) uniformly.

**Pro:** One interface, no branching in the registry or controller. Adding a provider is a pure addition.  
**Con:** The method name `fetch()` is generic; a developer needs to check `kind` to understand a provider's behaviour.

#### Option A2 — Split interface: `LookupProvider` + `EstimationProvider`

```typescript
interface LookupProvider    { readonly kind: 'lookup';     search(ctx): Promise<NutritionResult[]>; }
interface EstimationProvider { readonly kind: 'estimation'; estimate(ctx): Promise<NutritionResult[]>; }
type DataProvider = LookupProvider | EstimationProvider;
```

**Pro:** Method names are self-documenting.  
**Con:** Registry and controller must type-narrow to call the right method — boilerplate with no runtime benefit over A1.

---

## B. Provider Registration

**Chosen:** NestJS multi-provider token.

#### Option B1 — NestJS multi-provider token *(chosen)*

```typescript
{ provide: DATA_PROVIDERS, useClass: OpenAiProvider, multi: true }
```

**Pro:** Pure DI, no manual wiring. Adding a provider is one line.  
**Con:** All providers are always instantiated, even unavailable ones.

#### Option B2 — Explicit array, manual instantiation

```typescript
const ENABLED_PROVIDERS: Type<DataProvider>[] = [OpenAiProvider, AnthropicProvider];
```

**Pro:** Very explicit, no DI magic.  
**Con:** Providers can't inject NestJS services (`ConfigService`, `HttpService`) directly.

#### Option B3 — DB-configured providers

Provider config (keys, enabled flag) stored in a DB table, editable via admin API.

**Pro:** No redeploy to enable/disable a provider or rotate keys.  
**Con:** Significant extra scope — admin UI, migrations, secrets management. Far beyond Card #116.

---

## C. Import Endpoint Location

**Chosen:** sub-resource on servings.

#### Option C1 — Sub-resource on servings *(chosen)*

```
POST /catalog/servings/:id/nutrition-import
POST /catalog/servings/:id/apply-nutrition
```

**Pro:** Natural REST structure. The full serving context (size, unit, food name) is loaded from the DB — the caller doesn't need to supply it.  
**Con:** Requires a serving to exist first. Can't pre-estimate during food creation.

#### Option C2 — Standalone endpoint

```
POST /catalog/nutrition/estimate
Body: { foodName, servingSize, servingUnit, provider?, extraContext? }
```

**Pro:** Works before a serving is created. Useful for MCP tools without a serving ID.  
**Con:** Caller must supply all fields; loses DB context.

#### Option C3 — Inline in the serving response

On `GET /catalog/servings/:id`, return an `estimate` field alongside the serving when `status = NEEDS_REVIEW`.

**Pro:** One request for everything.  
**Con:** Couples external API latency to every serving fetch. Uncacheable. Terrible UX if the provider is slow.

---

## D. Apply / Confirm Flow

**Chosen:** import → apply → verify (three separate steps).

#### Option D1 — Three steps *(chosen)*

1. Import returns results for review.
2. Apply writes nutrition fields; status stays `NEEDS_REVIEW`.
3. Verify promotes status to `VERIFIED`.

**Pro:** Fits the existing status model. User can edit values between apply and verify. Clear audit trail via `dataSource`.  
**Con:** May feel like friction if the user trusts the estimate completely.

#### Option D2 — Two steps: import → verify

`POST /catalog/servings/:id/verify` accepts an optional nutrition body, skipping the apply step.

**Pro:** Fewer API calls.  
**Con:** No intermediate "applied but not verified" state — if the user closes the app after applying, the serving still shows `NEEDS_REVIEW` with empty nutrition, which is confusing.

#### Option D3 — Persist estimates in a separate table

```prisma
model NutritionEstimate {
  id        String   @id @default(uuid())
  servingId String
  provider  String
  payload   String   // JSON blob
  createdAt DateTime @default(now())
}
```

**Pro:** Full history of what each provider suggested.  
**Con:** Extra schema complexity; estimates go stale as food/serving data changes.

---

## E. Extra Context Input — UI Placement

**Chosen:** Option E1 (input on the provider picker / import trigger screen).

#### Option E1 — Input on trigger screen *(chosen)*

An optional text field labelled *"Extra context (optional)"* shown on the provider picker screen, alongside the trigger button ("Estimate" / "Search"). Submitted together with the import request.

Example hint text: *"Describe how it was prepared, or paste key values from a nutrition label."*

**Pro:** One screen, one action. User types context and triggers import in a single step.  
**Con:** Field adds visual noise for users who never need it; first-time users may not know what to enter.

#### Option E2 — Input on review screen, "Re-estimate" action

No context field on the trigger screen. After seeing the initial result, the user can tap "Add context & re-estimate", enter a note, and the import re-fires.

**Pro:** Clean trigger flow; context field only appears when the first result isn't good enough.  
**Con:** Two provider round-trips if extra context is needed; more complex navigation.

---

## F. Serving Size Mismatch — Scaling Strategy

**Chosen:** auto-scale on the backend; surface a note on the review screen.

#### Option F1 — Auto-scale on backend *(chosen)*

The backend detects the mismatch at `apply-nutrition` time, scales all values proportionally, and records the scaling in `dataSource`. The review screen shows a note.

**Pro:** User sees already-correct values in the form with no extra steps.  
**Con:** Scaling is invisible unless the user reads the note. A false-compatible unit match would silently produce wrong data.

#### Option F2 — Explicit confirmation sheet

If the user picks a mismatched result, a sheet asks: *"This result is per 100g but your serving is 50g. Scale automatically?"*

**Pro:** Explicit consent before any transformation.  
**Con:** Extra step that most users will always approve.

#### Option F3 — No auto-scaling; always show raw values

The review screen shows raw values and `resultServingSize`; the user adjusts manually.

**Pro:** No hidden transformations.  
**Con:** Mental arithmetic every time, which is the common case for most food databases (typically per 100g).

---

## G. Provider Credential Configuration

**Chosen:** environment variables per provider.

**Context:** BzFit is a self-hosted, single-user application deployed as a Docker container.

#### Option G1 — Environment variables *(chosen)*

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini     # optional
ANTHROPIC_API_KEY=sk-ant-...
FATSECRET_CLIENT_ID=abc
FATSECRET_CLIENT_SECRET=xyz
```

Providers read vars via `ConfigService`. Missing config → `isAvailable() = false`, no startup errors.

**Pro:** Standard 12-factor pattern. Works with `.env`, `docker run -e`, Compose `environment:`, CI/CD secret injection. Zero schema changes.  
**Con:** Server restart required to rotate a key. Credentials visible in `docker inspect`.

#### Option G2 — Docker secrets (file-mounted)

```typescript
const key = fs.readFileSync('/run/secrets/openai_api_key', 'utf8').trim();
```

**Pro:** Secrets not exposed in `docker inspect`.  
**Con:** Requires Swarm / Compose v3. Non-standard in NestJS. Still needs restart to rotate.

#### Option G3 — Database table

Credentials + settings in a `ProviderConfig` table, editable via admin API.

**Pro:** No restart to rotate keys or enable providers.  
**Con:** Keys stored plaintext in DB. Needs migration, admin auth guard, and admin UI. Significant extra scope.

#### Option G4 — Hybrid: env vars for secrets, DB for settings

Keys in env vars; non-secret settings (model name, enabled flag) in the DB.

**Pro:** Keys never in DB; settings changeable without restart.  
**Con:** Two separate places to configure — confusing. New providers still need a restart for env var.

#### Option G5 — External secrets manager (Vault, AWS SSM)

**Pro:** Best security posture; supports rotation without restart.  
**Con:** Heavy operational dependency for a self-hosted hobby app.

#### Comparison

| | Restart to change key | Keys in DB | Setup complexity | Plain Docker |
|---|---|---|---|---|
| G1 — Env vars | Yes | No | Low | ✓ |
| G2 — Docker secrets | Yes | No | Medium | Swarm/Compose only |
| G3 — DB table | No | Yes (plaintext) | High | ✓ |
| G4 — Hybrid | Yes (new providers) | No | Medium | ✓ |
| G5 — Vault/SSM | No | No | Very high | Needs external service |

---

## H. Module Location

**Chosen:** submodule inside `catalog`.

#### Option H1 — Submodule inside `catalog` *(chosen)*

```
packages/server/src/modules/catalog/providers/
```

**Pro:** Providers currently only operate on foods/servings. Natural place to look.  
**Con:** If providers are later needed in other modules, they'd require re-exporting through `CatalogModule`.

#### Option H2 — Top-level module

```
packages/server/src/modules/data-providers/
```

**Pro:** Shareable across modules without re-exporting chains.  
**Con:** Overkill when only the catalog module uses them today.

#### Option H3 — Part of a future `integrations` module

```
packages/server/src/modules/integrations/
├── data-providers/
├── barcode/
└── usda/
```

**Pro:** Good long-term home if many external integrations arrive.  
**Con:** Premature — adds structural overhead for one feature.
