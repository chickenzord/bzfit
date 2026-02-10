# BzFit Fixtures

This directory contains YAML fixture files for seeding the database with catalog data.

## Usage

```bash
npm run fixtures:load
```

This command is **idempotent** - running it multiple times will update existing data rather than creating duplicates.

## Directory Structure

```
fixtures/
├── users.yml           # User accounts
├── foods/              # Food catalog
│   ├── mcdonalds.yml   # McDonald's items
│   └── common-foods.yml # Generic foods
└── README.md
```

## YAML Format

### Users (`users.yml`)

```yaml
users:
  - email: demo@bzfit.local
    password: Demo1234!
    name: Demo User
```

**Matching:** Users are matched by `email`. If a user with that email exists, it will be updated.

### Foods (`foods/*.yml`)

```yaml
- name: French Fries
  brand: McDonald's          # Optional
  variant: Curly              # Optional
  servings:
    - name: Small             # Optional
      size: 71
      unit: g
      calories: 220
      protein: 2.5
      carbs: 29
      fat: 10
      saturatedFat: 1.5       # Optional
      transFat: 0             # Optional
      fiber: 2.5              # Optional
      sugar: 0.2              # Optional
      sodium: 160             # Optional
      cholesterol: 0          # Optional
      vitaminA: 0             # Optional
      vitaminC: 5             # Optional
      calcium: 10             # Optional
      iron: 0.5               # Optional
      status: VERIFIED        # VERIFIED | NEEDS_REVIEW | USER_CREATED
      dataSource: manual      # Optional
      isDefault: true         # Optional (default: false)
```

**Matching:**
- Foods are matched by `(name, variant, brand)` combination
- Servings are matched by `(foodId, size, unit)` combination

## Adding New Fixtures

1. Create a new YAML file in the appropriate directory
2. Follow the format examples above
3. Run `npm run fixtures:load` to import

## Notes

- Passwords are hashed with bcrypt before storage
- All nutrition values are optional except serving size and unit
- Use `isDefault: true` to mark the primary serving size for a food
- Running the loader multiple times is safe (upsert logic)
