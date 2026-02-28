# API Guidelines

Guidelines for the BzFit REST API (`@bzfit/server`).

---

## Conventions

- All endpoints namespaced at `/api/v1/*`
- Responses are JSON only — no HTML, no server-side rendering
- Auto-generated OpenAPI docs available at `/api/docs` (Swagger UI) when the server is running
- Use Zod schemas (via `nestjs-zod`) as the single source of truth for validation; derive NestJS DTO classes from them
- DTOs live in `packages/shared/src/dto/` and are imported by both server and app

**For the actual endpoint definitions, request/response shapes, and validation rules, read the source directly:**
- Controllers: `packages/server/src/modules/*/` (`*.controller.ts`)
- DTOs / schemas: `packages/shared/src/dto/`

---

## Authentication

### JWT (mobile app)
- Login returns a JWT access token
- Stored in `expo-secure-store` (native) or `localStorage` (web)
- Sent as `Authorization: Bearer {token}`
- Protected with `@UseGuards(JwtAuthGuard)` in NestJS controllers

### API Keys (external systems / MCP servers)
- Sent as `?api_key=xxx` query param **or** `Authorization: ApiKey xxx` header
- Validated via a custom Passport strategy against the `ApiKey` table
- Scoped permissions: e.g. `["read:meals", "write:foods"]`

---

## Cache Invalidation

See [`docs/caching-strategy.md`](caching-strategy.md) for the React Query cache invalidation strategy, including cross-domain invalidation rules between the catalog and nutrition domains.

---

## Search-First Logging Flow

The primary user flow for logging a meal:

1. Search the food catalog
2. **Found** → select serving → log to meal (add to existing meal or create new)
3. **Not found** → quick-add with food name + serving size → creates Food + Serving (`status=NEEDS_REVIEW`) + MealItem (`isEstimated=true`)
4. User reviews `NEEDS_REVIEW` items later and fills in nutrition data
