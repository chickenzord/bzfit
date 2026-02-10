# Shared Entity Types

This directory exports Prisma-generated types for use across the application.

## Usage

```typescript
import { User, Food, Serving, Meal, MealItem, ServingStatus, MealType } from '@/shared/entities';
```

## Available Types

- **User** - User accounts
- **ApiKey** - API keys for external integrations
- **Food** - Food items (name, variant, brand)
- **Serving** - Serving sizes with nutrition data
- **Meal** - Meal containers (date + meal type)
- **MealItem** - Links meals to food servings with quantity

## Enums

- **ServingStatus**: VERIFIED | NEEDS_REVIEW | USER_CREATED
- **MealType**: BREAKFAST | LUNCH | DINNER | SNACK
