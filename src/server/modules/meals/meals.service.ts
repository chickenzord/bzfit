import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MealResponseDto, MealItemResponseDto, NutritionTotalsDto } from '../../../shared/dto';

@Injectable()
export class MealsService {
  constructor(private prisma: PrismaService) {}

  /**
   * List meals with optional filters
   */
  async findAll(userId: string, date?: string, mealType?: string) {
    const where: any = { userId };

    if (date) {
      // Parse date and create range for the entire day
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.date = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    if (mealType) {
      where.mealType = mealType;
    }

    const meals = await this.prisma.meal.findMany({
      where,
      include: {
        items: {
          include: {
            food: true,
            serving: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return meals.map((meal) => this.formatMealResponse(meal));
  }

  /**
   * Get single meal by ID with all details
   */
  async findOne(userId: string, id: string): Promise<MealResponseDto> {
    const meal = await this.prisma.meal.findFirst({
      where: {
        id,
        userId, // Ensure user owns this meal
      },
      include: {
        items: {
          include: {
            food: true,
            serving: true,
          },
        },
      },
    });

    if (!meal) {
      throw new NotFoundException(`Meal with ID ${id} not found`);
    }

    return this.formatMealResponse(meal);
  }

  /**
   * Get daily summary: all meals for a specific date with totals
   */
  async getDailySummary(userId: string, date: string) {
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const meals = await this.prisma.meal.findMany({
      where: {
        userId,
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      include: {
        items: {
          include: {
            food: true,
            serving: true,
          },
        },
      },
      orderBy: {
        mealType: 'asc', // BREAKFAST, LUNCH, DINNER, SNACK
      },
    });

    const formattedMeals = meals.map((meal) => this.formatMealResponse(meal));

    // Calculate day totals
    const dayTotals = this.calculateDayTotals(formattedMeals);

    return {
      date,
      meals: formattedMeals,
      totals: dayTotals,
    };
  }

  /**
   * Format meal entity to response DTO with calculated nutrition
   */
  private formatMealResponse(meal: any): MealResponseDto {
    const formattedItems = meal.items.map((item: any) => this.formatMealItemResponse(item));
    const totals = this.calculateMealTotals(formattedItems);

    return {
      id: meal.id,
      userId: meal.userId,
      date: meal.date.toISOString().split('T')[0], // Return as YYYY-MM-DD
      mealType: meal.mealType,
      notes: meal.notes,
      items: formattedItems,
      totals,
      createdAt: meal.createdAt.toISOString(),
      updatedAt: meal.updatedAt.toISOString(),
    };
  }

  /**
   * Format meal item with expanded details and calculated nutrition
   */
  private formatMealItemResponse(item: any): MealItemResponseDto {
    const serving = item.serving;
    const food = item.food;

    // Calculate nutrition for this item (serving * quantity)
    const nutrition = {
      calories: this.multiplyNutrition(serving.calories, item.quantity),
      protein: this.multiplyNutrition(serving.protein, item.quantity),
      carbs: this.multiplyNutrition(serving.carbs, item.quantity),
      fat: this.multiplyNutrition(serving.fat, item.quantity),
    };

    return {
      id: item.id,
      mealId: item.mealId,
      foodId: item.foodId,
      servingId: item.servingId,
      quantity: item.quantity,
      notes: item.notes,
      isEstimated: item.isEstimated,
      food: {
        id: food.id,
        name: food.name,
        variant: food.variant,
        brand: food.brand,
      },
      serving: {
        id: serving.id,
        name: serving.name,
        size: serving.size,
        unit: serving.unit,
        calories: serving.calories,
        protein: serving.protein,
        carbs: serving.carbs,
        fat: serving.fat,
      },
      nutrition,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  /**
   * Calculate meal nutrition totals from items
   */
  private calculateMealTotals(items: MealItemResponseDto[]): NutritionTotalsDto {
    return items.reduce(
      (totals, item) => ({
        calories: totals.calories + (item.nutrition.calories || 0),
        protein: totals.protein + (item.nutrition.protein || 0),
        carbs: totals.carbs + (item.nutrition.carbs || 0),
        fat: totals.fat + (item.nutrition.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }

  /**
   * Calculate day totals from multiple meals
   */
  private calculateDayTotals(meals: MealResponseDto[]): NutritionTotalsDto {
    return meals.reduce(
      (totals, meal) => ({
        calories: totals.calories + meal.totals.calories,
        protein: totals.protein + meal.totals.protein,
        carbs: totals.carbs + meal.totals.carbs,
        fat: totals.fat + meal.totals.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }

  /**
   * Multiply nutrition value by quantity, handling null values
   */
  private multiplyNutrition(value: number | null, quantity: number): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    return Math.round(value * quantity * 10) / 10; // Round to 1 decimal
  }
}
