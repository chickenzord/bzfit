# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BzFit** is a self-hosted calorie tracking application built as a NestJS + Expo monorepo using **pnpm workspaces**. The core philosophy is "embrace imperfections" - allowing quick, flexible meal logging with deferred nutrition data entry.

Key principles:
- **Search-first workflow**: Log meals quickly, fill in nutrition details later
- **Food-Serving separation**: One food can have multiple serving sizes
- **Status tracking**: Foods/servings marked as VERIFIED, NEEDS_REVIEW, or USER_CREATED
- **API-first**: Backend serves JSON only; mobile app is the primary UI

## Tech Stack

- **Package Manager**: pnpm with workspaces
- **Backend**: NestJS (TypeScript) with Prisma ORM (`@bzfit/server`)
- **Mobile**: Expo + React Native + NativeWind (`@bzfit/app`)
- **Shared**: TypeScript DTOs and entities (`@bzfit/shared`)
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Auth**: JWT for app, API Keys for external systems/MCP servers
- **Deployment**: Docker image for backend API only

## UI Implementation

Mobile app uses NativeWind (TailwindCSS for React Native):
- **NativeWind v4** for styling
- **Expo Router** for navigation
- **@expo/vector-icons** (Ionicons) for icons
- **Dark mode** support from day 1
- Minimalist design with vibrant accent colors

## Common Commands

```bash
# Development
pnpm run dev                   # Run backend (3001)
pnpm run dev:server            # Backend only
pnpm run dev:app               # Expo app (Metro bundler)

# Database
pnpm prisma generate           # Generate Prisma client types
pnpm prisma migrate dev        # Create and apply migration (dev)
pnpm prisma migrate deploy     # Apply migrations (production)
pnpm prisma studio             # Visual DB editor

# Build
pnpm run build                 # Build server
pnpm run build:server          # NestJS build → packages/server/dist

# Production
pnpm run start:prod            # Run production build
docker build -t bzfit .        # Build Docker image
docker run -p 3000:3000 bzfit  # Run container

# Install
pnpm install                   # Install all workspace dependencies
```

## Architecture

### Monorepo Structure (pnpm workspaces)
```
bzfit/
├── pnpm-workspace.yaml        # Workspace config
├── package.json               # Root: scripts, shared dev deps
├── prisma/                    # Prisma schema & migrations (root)
├── packages/
│   ├── shared/                # @bzfit/shared - DTOs, entities
│   │   ├── package.json
│   │   └── src/
│   │       ├── dto/           # API request/response DTOs
│   │       ├── entities/      # Domain models from Prisma
│   │       └── index.ts       # Barrel export
│   ├── server/                # @bzfit/server - NestJS backend
│   │   ├── package.json
│   │   ├── nest-cli.json
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── catalog/   # Food catalog (foods, servings)
│   │       │   ├── nutrition/ # Meal logging, goals
│   │       │   └── auth/      # JWT + API key auth
│   │       └── prisma/        # Prisma service wrapper
│   └── app/                   # @bzfit/app - Expo mobile
│       ├── package.json
│       └── app/               # Expo Router pages
```

### Cross-package imports
- Import shared types: `import { FoodResponseDto } from '@bzfit/shared'`
- All packages depend on `@bzfit/shared` via `"@bzfit/shared": "workspace:*"`

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
4. MealItem gets `isEstimated=true` flag → shows warning in UI
5. User reviews later via `/api/v1/foods/needs-review` endpoint

### Authentication
- **Mobile app**: JWT in expo-secure-store (native) / localStorage (web), sent as `Authorization: Bearer {token}`
- **External systems**: API keys as query param `?api_key=xxx` or header `Authorization: ApiKey xxx`
- **Scopes**: Array like `["read:meals", "write:foods"]` for permission control
- **NestJS guards**: `@UseGuards(JwtAuthGuard)` for frontend, custom Passport strategy for API keys

### Database Flexibility
Prisma handles SQLite ↔ PostgreSQL switching via `DATABASE_URL` env var. Use:
- `file:./dev.db` for local development
- `postgresql://...` for production
- Migrations work across both databases

### Docker Deployment
Backend serves the API only:
- API routes: `/api/v1/*`
- Startup: `pnpm prisma migrate deploy && node packages/server/dist/main.js`

## API Patterns

All endpoints namespaced at `/api/v1/*`. Auto-generated OpenAPI docs at `/api/docs`.

**Catalog namespace** (`/api/v1/catalog/*`) - Food database:
- `GET /catalog/foods` - List all foods
- `GET /catalog/foods/search?q=...` - Search food catalog
- `GET /catalog/foods/{id}` - Get food details
- `GET /catalog/servings/{id}` - Get serving details
- `GET /catalog/needs-review` - List items requiring nutrition data
- `PATCH /catalog/servings/{id}` - Update nutrition + status

**Nutrition namespace** (`/api/v1/nutrition/*`) - Meal logging:
- `POST /nutrition/quick-add` - Add food + serving + log to meal in one call
- `GET /nutrition/meals` - List meals
- `GET /nutrition/meals/daily-summary?date=...` - Daily totals
- `POST /nutrition/meals` - Create meal with items
- `POST /nutrition/meals/{id}/items` - Add item to existing meal

Use `class-validator` decorators (`@IsNotEmpty()`, `@Min(0)`, etc.) in DTOs.

## Testing Strategy

- **Backend**: Jest for unit tests, e2e tests with separate test database
- **Prisma tests**: Override `DATABASE_URL` to use test database, reset between tests

## Evolving Specification

The `initial_spec.md` is the source of truth but can evolve. When requirements change:
1. Update `initial_spec.md` first
2. Generate migrations: `pnpm prisma migrate dev --name descriptive_name`
3. Update DTOs in `packages/shared/src/dto/`
4. Update API endpoints and UI accordingly

## Out of MVP Scope

Not implemented yet (future):
- Barcode scanning
- USDA/OpenFoodFacts API integration
- Recipe builder
- Meal templates
- Nutrition goals
