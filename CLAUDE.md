# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BzFit** is a self-hosted calorie tracking application built as a NestJS + React monorepo. The core philosophy is "embrace imperfections" - allowing quick, flexible meal logging with deferred nutrition data entry.

Key principles:
- **Search-first workflow**: Log meals quickly, fill in nutrition details later
- **Food-Serving separation**: One food can have multiple serving sizes
- **Status tracking**: Foods/servings marked as VERIFIED, NEEDS_REVIEW, or USER_CREATED
- **Single Docker deployment**: Frontend served by NestJS backend

## Tech Stack

- **Backend**: NestJS (TypeScript) with Prisma ORM
- **Frontend**: React + Vite
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Auth**: JWT for frontend, API Keys for external systems/MCP servers
- **Deployment**: Single Docker image serving both frontend (/) and API (/api/v1/*)

## Common Commands

```bash
# Development
npm run dev                    # Run both frontend (5173) and backend (3001) concurrently
npm run dev:server             # Backend only
npm run dev:client             # Frontend only

# Database
npx prisma generate            # Generate Prisma client types
npx prisma migrate dev         # Create and apply migration (dev)
npx prisma migrate deploy      # Apply migrations (production)
npx prisma studio              # Visual DB editor

# Build
npm run build                  # Build both client and server
npm run build:client           # Vite build → dist/client
npm run build:server           # NestJS build → dist/server

# Production
npm run start:prod             # Run production build
docker build -t bzfit .        # Build Docker image
docker run -p 3000:3000 bzfit  # Run container
```

## Architecture

### Monorepo Structure
```
src/
├── server/              # NestJS backend (API at /api/v1/*)
│   ├── modules/
│   │   ├── foods/       # Food CRUD, search, quick-add
│   │   ├── meals/       # Meal logging, item management
│   │   └── auth/        # JWT + API key authentication
│   └── prisma/          # Prisma service wrapper
├── client/              # React + Vite (served at /)
│   └── src/
│       ├── components/
│       ├── pages/
│       └── api/         # Type-safe API client
└── shared/              # Shared TypeScript types
    ├── dto/             # API request/response DTOs
    └── entities/        # Domain models from Prisma
```

### Data Model Philosophy

**Food vs Serving**: Food is the item (e.g., "French Fries"), Serving is the size variant (e.g., "Small 71g", "Medium 111g"). This allows:
- Multiple serving sizes per food
- Different nutrition profiles per serving
- Status tracking at serving level

**Meal as Container**: Meals group MealItems by date + meal type (breakfast/lunch/dinner/snack). No timestamps - busy people don't need exact timing.

**Status Workflow**:
1. Quick-add during meal → `status=NEEDS_REVIEW`, `isEstimated=true`
2. Review later when you have package label
3. Mark as `VERIFIED` after adding nutrition data

### Key Prisma Relations
- `Food` → `Serving[]` (one food, many serving sizes)
- `Meal` → `MealItem[]` (one meal, many food items)
- `MealItem` → references both `Food` and `Serving` + quantity multiplier
- `@@unique([userId, date, mealType])` on Meal - one breakfast/lunch/dinner/snack per day

## Critical Implementation Details

### Search-First Logging Flow
1. User searches "nasi goreng" → `GET /api/v1/foods/search?q=...`
2. If found: Select serving → Log to meal
3. If not found: Quick-add creates Food + Serving with `status=NEEDS_REVIEW`
4. MealItem gets `isEstimated=true` flag → shows ⚠️ in UI
5. User reviews later via `/api/v1/foods/needs-review` endpoint

### Authentication
- **Frontend (React)**: JWT in localStorage, sent as `Authorization: Bearer {token}`
- **External systems**: API keys as query param `?api_key=xxx` or header `Authorization: ApiKey xxx`
- **Scopes**: Array like `["read:meals", "write:foods"]` for permission control
- **NestJS guards**: `@UseGuards(JwtAuthGuard)` for frontend, custom Passport strategy for API keys

### Database Flexibility
Prisma handles SQLite ↔ PostgreSQL switching via `DATABASE_URL` env var. Use:
- `file:./dev.db` for local development
- `postgresql://...` for production
- Migrations work across both databases

### Single Docker Deployment
Frontend is built as static files and served by NestJS:
- Static files: `app.useStaticAssets(join(__dirname, '..', 'client'))`
- API routes: `/api/v1/*`
- Frontend routes: All others (React Router handles client-side routing)
- Startup: `npx prisma migrate deploy && node dist/server/main.js`

## API Patterns

All endpoints at `/api/v1/*`. Auto-generated OpenAPI docs at `/api/docs`.

Key endpoints:
- `GET /foods/search?q=...` - Search food catalog
- `POST /foods/quick-add` - Add food + serving + log to meal in one call
- `POST /meals` - Create meal with items
- `POST /meals/{id}/items` - Add item to existing meal
- `GET /foods/needs-review` - List items requiring nutrition data
- `PATCH /servings/{id}` - Update nutrition + status

Use `class-validator` decorators (`@IsNotEmpty()`, `@Min(0)`, etc.) in DTOs.

## Testing Strategy

- **Backend**: Jest for unit tests, e2e tests with separate test database
- **Frontend**: Vitest + React Testing Library
- **Prisma tests**: Override `DATABASE_URL` to use test database, reset between tests

## Evolving Specification

The `initial_spec.md` is the source of truth but can evolve. When requirements change:
1. Update `initial_spec.md` first
2. Generate migrations: `npx prisma migrate dev --name descriptive_name`
3. Update DTOs in `src/shared/dto/`
4. Update API endpoints and UI accordingly

## Out of MVP Scope

Not implemented yet (future):
- Barcode scanning
- USDA/OpenFoodFacts API integration
- Recipe builder
- Meal templates
- Nutrition goals
- PWA/mobile app
