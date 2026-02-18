#!/usr/bin/env ts-node
/**
 * Dev meal seed script
 *
 * Populates meals + items for the last 6 days (today through today−5).
 * Skips any date that already has meal records — safe to run multiple times.
 *
 * Usage: pnpm run seed:meals
 */

import { PrismaClient, MealType, ServingStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Inline food data — upserted on every run so the script is self-contained.
// ---------------------------------------------------------------------------

const SEED_FOODS = [
  {
    name: 'White Rice',
    variant: 'Cooked',
    serving: { name: '1 cup', size: 158, unit: 'g', calories: 205, protein: 4.2, carbs: 45, fat: 0.4 },
  },
  {
    name: 'Oatmeal',
    variant: 'Plain, Cooked',
    serving: { name: '1 cup', size: 234, unit: 'g', calories: 154, protein: 5.0, carbs: 27.0, fat: 3.0 },
  },
  {
    name: 'Chicken Breast',
    variant: 'Grilled, skinless',
    serving: { name: '100g', size: 100, unit: 'g', calories: 165, protein: 31.0, carbs: 0, fat: 3.6 },
  },
  {
    name: 'Egg',
    variant: 'Large, whole',
    serving: { name: '1 egg', size: 50, unit: 'g', calories: 72, protein: 6.0, carbs: 0.4, fat: 5.0 },
  },
  {
    name: 'Banana',
    serving: { name: '1 medium', size: 118, unit: 'g', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.4 },
  },
  {
    name: 'Tempe',
    variant: 'Fried',
    serving: { name: '100g', size: 100, unit: 'g', calories: 201, protein: 19.0, carbs: 7.7, fat: 11.0 },
  },
  {
    name: 'Tahu',
    variant: 'Fried',
    serving: { name: '100g', size: 100, unit: 'g', calories: 109, protein: 7.8, carbs: 2.0, fat: 7.8 },
  },
] as const;

type SeedFoodName = (typeof SEED_FOODS)[number]['name'];

// ---------------------------------------------------------------------------
// 6-day rotating meal plan (index 0 = today, 5 = today−5)
// ---------------------------------------------------------------------------

type MealPlan = Partial<Record<MealType, { food: SeedFoodName; qty: number }[]>>;

const MEAL_PLANS: MealPlan[] = [
  // Day 0 – today
  {
    BREAKFAST: [{ food: 'Oatmeal', qty: 1 }, { food: 'Banana', qty: 1 }],
    LUNCH:     [{ food: 'White Rice', qty: 1.5 }, { food: 'Chicken Breast', qty: 1 }],
    DINNER:    [{ food: 'White Rice', qty: 1 }, { food: 'Tempe', qty: 1 }, { food: 'Tahu', qty: 1 }],
  },
  // Day 1
  {
    BREAKFAST: [{ food: 'Egg', qty: 2 }, { food: 'Banana', qty: 1 }],
    LUNCH:     [{ food: 'White Rice', qty: 1.5 }, { food: 'Chicken Breast', qty: 1 }],
    DINNER:    [{ food: 'White Rice', qty: 1 }, { food: 'Chicken Breast', qty: 1 }],
    SNACK:     [{ food: 'Banana', qty: 1 }],
  },
  // Day 2
  {
    BREAKFAST: [{ food: 'Oatmeal', qty: 1 }],
    LUNCH:     [{ food: 'White Rice', qty: 1.5 }, { food: 'Tempe', qty: 1 }, { food: 'Egg', qty: 1 }],
    DINNER:    [{ food: 'White Rice', qty: 1 }, { food: 'Chicken Breast', qty: 1 }],
  },
  // Day 3
  {
    BREAKFAST: [{ food: 'Egg', qty: 2 }, { food: 'Oatmeal', qty: 1 }],
    LUNCH:     [{ food: 'White Rice', qty: 1.5 }, { food: 'Chicken Breast', qty: 1 }],
    DINNER:    [{ food: 'White Rice', qty: 1 }, { food: 'Tahu', qty: 1 }, { food: 'Tempe', qty: 1 }],
    SNACK:     [{ food: 'Banana', qty: 1 }],
  },
  // Day 4
  {
    BREAKFAST: [{ food: 'Banana', qty: 2 }],
    LUNCH:     [{ food: 'White Rice', qty: 2 }, { food: 'Chicken Breast', qty: 1 }, { food: 'Egg', qty: 1 }],
    DINNER:    [{ food: 'White Rice', qty: 1 }, { food: 'Chicken Breast', qty: 1 }],
  },
  // Day 5 – today−5
  {
    BREAKFAST: [{ food: 'Oatmeal', qty: 1 }, { food: 'Egg', qty: 1 }],
    LUNCH:     [{ food: 'White Rice', qty: 1.5 }, { food: 'Tempe', qty: 1 }],
    DINNER:    [{ food: 'White Rice', qty: 1 }, { food: 'Chicken Breast', qty: 1 }, { food: 'Tahu', qty: 1 }],
    SNACK:     [{ food: 'Banana', qty: 1 }],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function utcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function addDays(date: Date, delta: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + delta);
  return d;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 BzFit dev meal seeder\n');

  // 1. Resolve user
  const user = await prisma.user.findFirst({ where: { email: 'user@example.com' } })
    ?? await prisma.user.findFirst();

  if (!user) {
    console.error('❌ No users found. Run fixtures first: pnpm run fixtures:load');
    process.exit(1);
  }
  console.log(`👤 User: ${user.email} (${user.id})\n`);

  // 2. Upsert seed foods + capture serving IDs
  const servingMap = new Map<SeedFoodName, string>();

  for (const def of SEED_FOODS) {
    const food = await prisma.food.upsert({
      where: { id: (await prisma.food.findFirst({ where: { name: def.name, variant: (def as any).variant ?? null } }))?.id ?? 'new' },
      update: {},
      create: { name: def.name, variant: (def as any).variant ?? undefined },
    });

    const existing = await prisma.serving.findFirst({
      where: { foodId: food.id, size: def.serving.size, unit: def.serving.unit },
    });

    const serving = await prisma.serving.upsert({
      where: { id: existing?.id ?? 'new' },
      update: { calories: def.serving.calories, protein: def.serving.protein, carbs: def.serving.carbs, fat: def.serving.fat },
      create: {
        foodId: food.id,
        name: def.serving.name,
        size: def.serving.size,
        unit: def.serving.unit,
        isDefault: true,
        calories: def.serving.calories,
        protein: def.serving.protein,
        carbs: def.serving.carbs,
        fat: def.serving.fat,
        status: ServingStatus.VERIFIED,
        dataSource: 'seed-dev-meals',
      },
    });

    servingMap.set(def.name, JSON.stringify({ foodId: food.id, servingId: serving.id }));
  }

  // 3. Seed meals for each day
  const today = utcDateOnly(new Date());

  for (let i = 0; i < 6; i++) {
    const date = addDays(today, -i);
    const dayLabel = date.toISOString().slice(0, 10);
    const plan = MEAL_PLANS[i];

    // Check if this date already has any meals
    const existing = await prisma.meal.count({
      where: {
        userId: user.id,
        date: { gte: date, lt: addDays(date, 1) },
      },
    });

    if (existing > 0) {
      console.log(`⏭️  ${dayLabel} — skipped (${existing} meal(s) already exist)`);
      continue;
    }

    console.log(`📅 ${dayLabel}`);

    for (const [mealType, items] of Object.entries(plan) as [MealType, { food: SeedFoodName; qty: number }[]][]) {
      const meal = await prisma.meal.create({
        data: { userId: user.id, date, mealType },
      });

      let mealKcal = 0;

      for (const { food: foodName, qty } of items) {
        const ref = JSON.parse(servingMap.get(foodName)!);
        const serving = await prisma.serving.findUniqueOrThrow({ where: { id: ref.servingId } });

        await prisma.mealItem.create({
          data: {
            mealId: meal.id,
            foodId: ref.foodId,
            servingId: ref.servingId,
            quantity: qty,
          },
        });

        mealKcal += (serving.calories ?? 0) * qty;
      }

      const names = items.map(({ food, qty }) => `${qty > 1 ? `${qty}× ` : ''}${food}`).join(', ');
      console.log(`   ${mealType.padEnd(9)} ${Math.round(mealKcal)} kcal  [${names}]`);
    }
  }

  console.log('\n✅ Done!\n');
}

main()
  .catch((err) => { console.error('❌', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
