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

See [`docs/expo-guidelines.md`](docs/expo-guidelines.md) for full Expo/React Native guidelines including color palette, component patterns, icon usage, and keyboard handling.

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

### Authentication

See [`docs/api-guidelines.md`](docs/api-guidelines.md#authentication) for full details. JWT for the mobile app, API keys for external systems/MCP servers.

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

See [`docs/api-guidelines.md`](docs/api-guidelines.md) for the full endpoint reference, authentication details, DTO conventions, and the search-first logging flow.

## Testing Strategy

- **Backend**: Jest for unit tests, e2e tests with separate test database
- **Prisma tests**: Override `DATABASE_URL` to use test database, reset between tests

## Evolving Specification

When requirements change:
1. Generate migrations: `pnpm prisma migrate dev --name descriptive_name`
2. Update DTOs in `packages/shared/src/dto/`
3. Update API endpoints and UI accordingly

## Agent Behavior Guidelines

### Documentation
- **Never reference code by line numbers** in any doc file. Line numbers shift constantly as code changes, making such references immediately stale. Reference by function name, symbol, or file path instead.

### Git Commits
- **Always ask the user before committing.** Never run `git commit` without explicit approval.

### Fizzy / Task Planning
- When breaking down a card, **post a comment** with the proposed plan for the user to review first. Do not create steps or sub-cards immediately.

### Mobile UI — Keyboard Avoidance
See [`docs/expo-guidelines.md`](docs/expo-guidelines.md#keyboard-avoidance) for the full pattern. In short: pages use `KeyboardAvoidingView behavior="padding"` + `automaticallyAdjustKeyboardInsets` on `ScrollView`; modals skip `KeyboardAvoidingView` and rely on `automaticallyAdjustKeyboardInsets` alone.

### Code Reuse
- Reuse existing components where practical.
- If reuse would require a significant refactor (e.g., a full-screen component that owns its own `ScrollView`/`KeyboardAvoidingView` needs to be embedded as a sub-section), it is acceptable to implement inline following the same visual style instead.
- In that case: **always leave a code comment** explaining why the component was not reused and what would be needed to do so in the future, so the next agent has the context. Example:
  ```tsx
  // ServingForm is not reused here because it is a full-screen component that owns its
  // own ScrollView + KeyboardAvoidingView. Embedding it as a sub-section would require
  // extracting the inner fields into a separate sub-component — a non-trivial refactor
  // left for a future cleanup.
  ```

## Out of MVP Scope

Not implemented yet (future):
- Barcode scanning
- USDA/OpenFoodFacts API integration
- Recipe builder
- Meal templates
- Nutrition goals
