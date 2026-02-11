# BzFit - Technical Specification

## Overview
Self-hosted calorie tracking application designed for busy people who need flexible, imperfection-friendly meal logging with extensibility via MCP and external integrations.

---

## Core Principles
- **Embrace imperfections**: Easy backfill, no exact timestamps/locations required
- **Search-first workflow**: Quick logging with deferred nutrition data entry
- **Extensible**: Well-defined REST API for MCP servers and external integrations
- **Self-hosted**: Own your data, SQLite for simplicity, Postgres for scale

---

## Tech Stack

### Framework & Languages
- **Backend**: NestJS (TypeScript)
- **Frontend**: React + Vite
- **ORM**: Prisma
- **Database**: SQLite (development) / PostgreSQL (production)
- **Auth**: JWT (frontend) + API Keys (external systems)

### Deployment
- **Monorepo**: Single repository with clear frontend/backend separation
- **Single Docker Image**: Frontend built as static files, served by NestJS
- **API**: Available at `/api/v1/*`
- **Frontend**: Served at `/`

---

## Project Structure
```
my-calorie-tracker/
├── src/
│   ├── server/              # NestJS backend
│   │   ├── modules/
│   │   │   ├── foods/       # Food & serving management
│   │   │   ├── meals/       # Meal logging
│   │   │   └── auth/        # JWT + API key auth
│   │   ├── prisma/          # Prisma service
│   │   └── main.ts
│   │
│   ├── client/              # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── api/         # API client (shared types)
│   │   └── vite.config.ts
│   │
│   └── shared/              # Shared TypeScript types
│       ├── dto/             # API request/response types
│       └── entities/        # Domain models
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Auto-generated migrations
│
├── Dockerfile               # Single image build
└── package.json
```

---

## Data Model

### Design Philosophy
- **Food-Serving Separation**: One food can have multiple serving sizes (100g, 1 cup, 1 plate)
- **Complete Nutrition Storage**: All micronutrients stored in DB, UI shows only macros by default
- **Meal as Container**: Groups food items with shared context (notes, date, meal type)
- **No Timestamps on Meals**: Just date + meal type (breakfast/lunch/dinner/snack)
- **Status Tracking**: `VERIFIED | NEEDS_REVIEW | USER_CREATED` for quality control

### Core Entities

#### Food
Represents a food item with optional brand and variant.
```prisma
model Food {
  id        String    @id @default(uuid())
  name      String    # "Corn Flakes", "Nasi Goreng", "French Fries"
  variant   String?   # "Honey Almond", "Extra Pedas", null
  brand     String?   # "Kellogg's", "McDonald's", "Warung Mbok Sri"
  
  servings  Serving[]
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

**Examples:**
- `name="Corn Flakes", variant="Honey", brand="Kellogg's"`
- `name="Nasi Goreng", variant="Ayam", brand=null`
- `name="French Fries", variant=null, brand="McDonald's"`

#### Serving
Different serving sizes for a food with complete nutrition data.
```prisma
model Serving {
  id          String   @id @default(uuid())
  foodId      String
  food        Food     @relation(...)
  
  name        String?  # "Small", "Medium", "1 cup equivalent", null
  size        Float    # 100, 30, 1
  unit        String   # "g", "ml", "cup", "piece", "tbsp", "plate"
  isDefault   Boolean  @default(false)
  
  // Macros (always displayed in UI)
  calories    Float?
  protein     Float?   # grams
  carbs       Float?   # grams
  fat         Float?   # grams
  
  // Detailed nutrition (stored, hidden in main UI)
  saturatedFat  Float?
  transFat      Float?
  fiber         Float?
  sugar         Float?
  sodium        Float? # mg
  cholesterol   Float? # mg
  vitaminA      Float?
  vitaminC      Float?
  calcium       Float?
  iron          Float?
  
  status      ServingStatus @default(NEEDS_REVIEW)
  dataSource  String?       # "usda", "openfoodfacts", "package_label", "user"
  
  mealItems   MealItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum ServingStatus {
  VERIFIED
  NEEDS_REVIEW
  USER_CREATED
}
```

**Real-world example:**
```
Food: name="French Fries", brand="McDonald's"
├─ Serving: name="Small", size=71, unit="g" → 230 kcal
├─ Serving: name="Medium", size=111, unit="g" → 340 kcal (isDefault=true)
└─ Serving: name="Large", size=154, unit="g" → 510 kcal
```

#### Meal
Container for food items eaten at a specific date and meal type.
```prisma
model Meal {
  id       String   @id @default(uuid())
  userId   String
  user     User     @relation(...)
  
  date     DateTime  # Date only, no time
  mealType MealType  # BREAKFAST, LUNCH, DINNER, SNACK
  notes    String?   # Meal-level context: "quick breakfast", "family dinner"
  
  items    MealItem[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, date, mealType]) // One breakfast per day per user
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}
```

#### MealItem
Links meals to food servings with quantity multiplier.
```prisma
model MealItem {
  id          String   @id @default(uuid())
  mealId      String
  meal        Meal     @relation(..., onDelete: Cascade)
  
  foodId      String
  food        Food     @relation(...)
  
  servingId   String
  serving     Serving  @relation(...)
  
  quantity    Float    @default(1.0)  # Multiplier (1.5 servings)
  notes       String?  # Item-specific: "extra peanut butter", "no sugar"
  isEstimated Boolean  @default(false) # From quick-add
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Example:**
"I ate 1.5 cups of Honey Corn Flakes for breakfast"
```
mealId → Today's breakfast
foodId → Corn Flakes (Honey, Kellogg's)
servingId → "1 cup equivalent" (30g, 111 kcal)
quantity → 1.5
→ Calculated: 111 kcal × 1.5 = 166.5 kcal
```

#### User & Authentication
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String?
  
  meals         Meal[]
  apiKeys       ApiKey[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model ApiKey {
  id        String    @id @default(uuid())
  key       String    @unique
  userId    String
  user      User      @relation(...)
  
  name      String    # "MCP Server", "Mobile App"
  scopes    String[]  # ["read:meals", "write:foods"]
  expiresAt DateTime?
  
  createdAt DateTime  @default(now())
  lastUsed  DateTime?
}
```

---

## Primary User Flow: Search-First Logging

### Flow Diagram
```
User searches "nasi goreng"
  ↓
Found in catalog?
  ├─ YES → Select food
  │         ↓
  │       Choose serving (e.g., "200g" or "1 plate")
  │         ↓
  │       Adjust quantity (e.g., 1.5 servings)
  │         ↓
  │       Log to meal
  │
  └─ NO → Quick Add:
          - Name: "nasi goreng"
          - Variant: "extra pedas" (optional)
          - Brand: "Warung Mbok Sri" (optional)
          - Serving: size=1, unit="plate"
          ↓
          Creates:
          - Food (status=NEEDS_REVIEW)
          - Serving (status=NEEDS_REVIEW, nutrition=null)
          - MealItem (isEstimated=true)
          ↓
          Shows ⚠️ flag in meal log
          ↓
          Review later when you have time
```

### Key API Endpoints
```typescript
// Search foods
GET /api/v1/catalog/foods/search?q=nasi+goreng

// Quick add (food not found)
POST /api/v1/nutrition/quick-add
{
  name: "nasi goreng spesial",
  variant: "extra pedas",
  brand: "Warung Mbok Sri",
  serving: { size: 1, unit: "plate" },
  mealId: "today-breakfast-uuid"
}

// Log existing food to meal
POST /api/v1/nutrition/meals
{
  date: "2025-02-06",
  mealType: "BREAKFAST",
  notes: "Quick breakfast before school run",
  items: [
    { foodId: "uuid", servingId: "uuid", quantity: 1.5 }
  ]
}

// Add item to existing meal
POST /api/v1/nutrition/meals/{mealId}/items
{
  foodId: "uuid",
  servingId: "uuid",
  quantity: 1,
  notes: "extra crispy"
}
```

---

## Review Workflow

### Purpose
Allow users to complete nutrition data for foods added via "Quick Add".

### Dashboard
- Badge: "5 items need nutrition review"
- Click → List of foods/servings with `status=NEEDS_REVIEW`

### Review Options
1. **Manual entry**: User has package label, fills nutrition form
2. **Search external DB**: USDA, OpenFoodFacts → import nutrition
3. **Add more servings**: Package has 100g info, user adds "1 cup" equivalent

### API Endpoints
```typescript
// Get items needing review
GET /api/v1/catalog/needs-review

// Update serving nutrition
PATCH /api/v1/catalog/servings/{servingId}
{
  calories: 450,
  protein: 15,
  carbs: 60,
  fat: 18,
  status: "VERIFIED"
}

// Add additional serving to existing food
POST /api/v1/catalog/foods/{foodId}/servings
{
  name: "1 cup equivalent",
  size: 30,
  unit: "g",
  calories: 111,
  isDefault: false
}
```

---

## Authentication Strategy

### JWT for Frontend (React)
- Login returns JWT access token
- Stored in localStorage
- Sent in `Authorization: Bearer {token}` header
- Protected routes use `@UseGuards(JwtAuthGuard)` in NestJS

### API Keys for External Systems
- For MCP servers, integrations, mobile apps
- Sent as `?api_key=xxx` query param or `Authorization: ApiKey xxx` header
- Custom Passport strategy validates from `ApiKey` table
- Scoped permissions: `["read:meals", "write:foods"]`

**API Key Management:**
```typescript
// Generate
POST /api/v1/auth/api-keys
{ name: "MCP Server", scopes: ["read:meals"] }

// List user's keys
GET /api/v1/auth/api-keys

// Revoke
DELETE /api/v1/auth/api-keys/{keyId}
```

---

## Database Migration Strategy

### SQLite → PostgreSQL Switch

**Development:**
```env
DATABASE_URL="file:./dev.db"
```

**Production:**
```env
DATABASE_URL="postgresql://user:pass@host:5432/calorie_tracker"
```

Prisma handles dialect differences automatically.

**Migration commands:**
```bash
# Development: Create + apply
npx prisma migrate dev --name add_servings_table

# Production: Apply pending
npx prisma migrate deploy
```

---

## Deployment

### Single Docker Image
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build:client  # Vite → dist/client
RUN npm run build:server  # NestJS → dist/server

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

ENV DATABASE_URL="file:./data/db.sqlite"
ENV NODE_ENV=production

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server/main.js"]
```

**Serves:**
- Frontend: `http://localhost:3000/`
- API: `http://localhost:3000/api/v1/*`

---

## UI/UX Guidelines

### Main View (Meal Log)
- **Show**: Date, Meal Type, Food Name, Serving, Quantity, Macros (Cal, P, C, F)
- **Hide**: Detailed nutrition (fiber, vitamins, etc.) until user expands
- **Flag**: ⚠️ for `isEstimated=true` or `status=NEEDS_REVIEW`

### Search Results Display
```
French Fries (McDonald's)
- Small (71g): 230 kcal | P:3g C:29g F:11g
- Medium (111g): 340 kcal | P:4g C:44g F:16g
- Large (154g): 510 kcal | P:6g C:66g F:24g
```

### Detail View
- Click food → Expand to show full nutrition facts
- Edit button → Opens review form

---

## API Documentation

- **OpenAPI/Swagger**: Auto-generated from NestJS decorators
- **Available at**: `/api/docs`
- **Use**: `@nestjs/swagger` package

---

## NPM Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "nest start --watch",
    "dev:client": "vite",
    
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build --outDir dist/client",
    "build:server": "nest build",
    
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:deploy": "prisma migrate deploy",
    
    "start:prod": "node dist/server/main.js"
  }
}
```

---

## Development Workflow
```bash
# Setup
npm install
npx prisma generate
npx prisma migrate dev

# Run dev servers
npm run dev
# Backend: http://localhost:3001
# Frontend: http://localhost:5173

# Build for production
npm run build
docker build -t calorie-tracker .
docker run -p 3000:3000 calorie-tracker
```

---

## Out of MVP Scope (Future Considerations)

- Barcode scanning for packaged foods
- Import from USDA / OpenFoodFacts API
- Recipe builder (multi-ingredient meals)
- Meal templates (save "usual breakfast")
- Nutrition goals tracking
- Progressive Web App (PWA) features
- Mobile app (React Native with shared API)

---

## Key Implementation Notes

1. **Type Safety**: Prisma generates types automatically, shared via `/src/shared/dto`
2. **Validation**: Use `class-validator` in NestJS DTOs (`@IsNotEmpty()`, `@Min(0)`)
3. **Error Handling**: NestJS exception filters for consistent API errors
4. **Testing**: Jest for backend (unit + e2e), Vitest + React Testing Library for frontend
5. **Prisma Testing**: Use separate test database with `DATABASE_URL` override

---

**End of Specification**
