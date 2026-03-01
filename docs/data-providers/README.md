# Data Providers

A pluggable interface for importing data from external sources into BzFit. The `dataType` field on each provider scopes it to a specific domain (`nutrition`, `workout`, etc.), keeping the interface generic while remaining purposeful.

AI-based providers (OpenAI, Anthropic) are **estimation** providers — their output is inferred. Database providers (FatSecret, Open Food Data) are **lookup** providers — their output is measured fact.

Card #116 ("AI Nutrition Estimation") is the first concrete use case. The architecture is designed so that adding future providers requires only implementing one interface and registering the module.

## Terminology

| Term | Meaning |
|---|---|
| **Import** | The user-facing action of bringing data in from any external provider |
| **Lookup** | A provider that queries a database and returns measured, verified records (e.g. FatSecret, Open Food Data) |
| **Estimation** | A provider that infers values from a description using AI/LLM (e.g. OpenAI, Anthropic) |
| **Provider** | Any backend implementation, lookup or estimation |
| **Data result** | The data returned by a provider before the user confirms it |

## Goals

- Define a single, stable interface that all providers implement.
- Make registration of a new provider a small, isolated change.
- Expose provider availability and data import via API so the mobile app (and MCP tools) can use it.
- Providers supply data; the user always reviews and confirms before a serving is marked `VERIFIED`.
- UI labels must clearly distinguish estimated data (AI-inferred) from looked-up data (measured fact).

## Documents

| File | Contents |
|---|---|
| [interface.md](interface.md) | `DataProvider` interface, context/result types, serving size mismatch, registry, adding a provider, configuration |
| [api.md](api.md) | API endpoints, shared DTOs, backend data flow |
| [user-flow.md](user-flow.md) | Step-by-step user flows for all provider kinds |
| [decisions.md](decisions.md) | Considered alternatives and trade-offs |

## Implementation Order (Card #116 scope)

1. **Shared DTOs** in `@bzfit/shared` — `NutritionResultSchema`, `NutritionImportResponseSchema`, `NutritionImportRequestSchema`.
2. **Interface + Registry** (`data-provider.interface.ts`, `data-provider.registry.ts`, `providers.module.ts`) — scaffolding with no external calls yet.
3. **Providers controller** (`providers.controller.ts`) — `GET /catalog/providers` endpoint returning `name`, `displayName`, `dataType`, `kind`, `available`.
4. **OpenAI provider** — first concrete implementation (`kind: 'estimation'`, `dataType: 'nutrition'`); uses structured output / JSON mode to reliably parse macros from the model response.
5. **Import + apply endpoints** on `ServingsController` — `POST /servings/:id/nutrition-import` and `POST /servings/:id/apply-nutrition` (with auto-scaling logic).
6. **Mobile UI** — "Get Nutrition Data" entry point on the NEEDS_REVIEW screen; provider picker with optional extra context field; results picker with serving size info for lookup providers; review screen with estimation vs. lookup banner and optional scaling note; "Apply Estimate" / "Apply Import" action; existing "Verify" flow unchanged.

Future providers (Anthropic, FatSecret, Open Food Data) slot in at step 4 without touching anything else.

## Out of Scope for Card #116

- Automatic background estimation on new NEEDS_REVIEW servings (could be a future job/queue feature).
- Caching provider responses (add later if latency or cost becomes a concern).
- Provider priority / fallback chains (e.g. try FatSecret first, fall back to OpenAI).
- Per-user provider preferences.
- Workout data providers (`dataType: 'workout'`).
