#!/usr/bin/env ts-node
/**
 * Fixture loader script
 * Loads catalog data from YAML files with upsert logic
 *
 * Usage: npm run fixtures:load
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PrismaClient, ServingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

interface UserFixture {
  email: string;
  password: string;
  name?: string;
}

interface ServingFixture {
  name?: string;
  size: number;
  unit: string;
  isDefault?: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  saturatedFat?: number;
  transFat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
  status?: ServingStatus;
  dataSource?: string;
}

interface FoodFixture {
  name: string;
  variant?: string;
  brand?: string;
  servings: ServingFixture[];
}

/**
 * Load users from fixtures/users.yml
 */
async function loadUsers() {
  const filePath = path.join(FIXTURES_DIR, 'users.yml');

  if (!fs.existsSync(filePath)) {
    console.log('⏭️  Skipping users (no users.yml found)');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const data = yaml.load(content) as { users: UserFixture[] };

  if (!data.users || !Array.isArray(data.users)) {
    console.log('⚠️  Invalid users.yml format (expected users array)');
    return;
  }

  console.log(`\n📦 Loading ${data.users.length} users...`);

  for (const userData of data.users) {
    const passwordHash = await bcrypt.hash(userData.password, 10);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        passwordHash,
      },
      create: {
        email: userData.email,
        passwordHash,
        name: userData.name,
      },
    });

    console.log(`  ✅ ${user.email} (${user.id})`);
  }
}

/**
 * Load foods from YAML files in fixtures/foods/
 */
async function loadFoods() {
  const foodsDir = path.join(FIXTURES_DIR, 'foods');

  if (!fs.existsSync(foodsDir)) {
    console.log('⏭️  Skipping foods (no foods/ directory found)');
    return;
  }

  const files = fs.readdirSync(foodsDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));

  if (files.length === 0) {
    console.log('⏭️  No food YAML files found in fixtures/foods/');
    return;
  }

  console.log(`\n📦 Loading foods from ${files.length} file(s)...`);

  for (const file of files) {
    const filePath = path.join(foodsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const foods = yaml.load(content) as FoodFixture[];

    if (!Array.isArray(foods)) {
      console.log(`⚠️  Skipping ${file} (not an array)`);
      continue;
    }

    console.log(`\n  📄 ${file}:`);

    for (const foodData of foods) {
      // Upsert food (match by name + variant + brand)
      const food = await prisma.food.upsert({
        where: {
          // Use a composite unique constraint if defined, or find first
          id: (
            await prisma.food.findFirst({
              where: {
                name: foodData.name,
                variant: foodData.variant || null,
                brand: foodData.brand || null,
              },
            })
          )?.id || 'new-food-placeholder',
        },
        update: {
          name: foodData.name,
          variant: foodData.variant,
          brand: foodData.brand,
        },
        create: {
          name: foodData.name,
          variant: foodData.variant,
          brand: foodData.brand,
        },
      });

      console.log(`    ✅ ${food.name}${food.variant ? ` (${food.variant})` : ''}${food.brand ? ` - ${food.brand}` : ''}`);

      // Upsert servings
      if (foodData.servings && Array.isArray(foodData.servings)) {
        for (const servingData of foodData.servings) {
          // Match serving by foodId + size + unit
          const existingServing = await prisma.serving.findFirst({
            where: {
              foodId: food.id,
              size: servingData.size,
              unit: servingData.unit,
            },
          });

          const serving = await prisma.serving.upsert({
            where: { id: existingServing?.id || 'new-serving-placeholder' },
            update: {
              name: servingData.name,
              isDefault: servingData.isDefault,
              calories: servingData.calories,
              protein: servingData.protein,
              carbs: servingData.carbs,
              fat: servingData.fat,
              saturatedFat: servingData.saturatedFat,
              transFat: servingData.transFat,
              fiber: servingData.fiber,
              sugar: servingData.sugar,
              sodium: servingData.sodium,
              cholesterol: servingData.cholesterol,
              vitaminA: servingData.vitaminA,
              vitaminC: servingData.vitaminC,
              calcium: servingData.calcium,
              iron: servingData.iron,
              status: servingData.status || ServingStatus.NEEDS_REVIEW,
              dataSource: servingData.dataSource,
            },
            create: {
              foodId: food.id,
              name: servingData.name,
              size: servingData.size,
              unit: servingData.unit,
              isDefault: servingData.isDefault,
              calories: servingData.calories,
              protein: servingData.protein,
              carbs: servingData.carbs,
              fat: servingData.fat,
              saturatedFat: servingData.saturatedFat,
              transFat: servingData.transFat,
              fiber: servingData.fiber,
              sugar: servingData.sugar,
              sodium: servingData.sodium,
              cholesterol: servingData.cholesterol,
              vitaminA: servingData.vitaminA,
              vitaminC: servingData.vitaminC,
              calcium: servingData.calcium,
              iron: servingData.iron,
              status: servingData.status || ServingStatus.NEEDS_REVIEW,
              dataSource: servingData.dataSource,
            },
          });

          console.log(
            `      → ${serving.name || 'Unnamed'} (${serving.size}${serving.unit}) - ${serving.calories || 0} kcal`,
          );
        }
      }
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Loading fixtures...\n');

  try {
    await loadUsers();
    await loadFoods();

    console.log('\n✅ Fixtures loaded successfully!\n');
  } catch (error) {
    console.error('\n❌ Error loading fixtures:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
