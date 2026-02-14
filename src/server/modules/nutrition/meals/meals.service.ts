import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  MealResponseDto,
  MealItemResponseDto,
  NutritionTotalsDto,
  CreateMealDto,
  AddMealItemDto,
  UpdateMealItemDto,
  NutritionGoalProgressDto,
  MacroProgressDto,
} from '../../../../shared/dto';
import { GoalsService } from '../goals/goals.service';

@Injectable()
export class MealsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => GoalsService))
    private goalsService: GoalsService,
  ) {}

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
   * Get daily summary: all meals for a specific date with totals and goal progress
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

    // Get active goal and calculate progress
    const activeGoal = await this.goalsService.getActive(userId);
    const goals = activeGoal ? this.calculateGoalProgress(dayTotals, activeGoal) : null;

    return {
      date,
      meals: formattedMeals,
      totals: dayTotals,
      goals,
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
      notes: meal.notes ?? null,
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
      notes: item.notes ?? null,
      isEstimated: item.isEstimated,
      food: {
        id: food.id,
        name: food.name,
        variant: food.variant ?? null,
        brand: food.brand ?? null,
      },
      serving: {
        id: serving.id,
        name: serving.name ?? null,
        size: serving.size,
        unit: serving.unit,
        calories: serving.calories ?? null,
        protein: serving.protein ?? null,
        carbs: serving.carbs ?? null,
        fat: serving.fat ?? null,
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
   * Create a new meal with optional initial items
   */
  async create(userId: string, createMealDto: CreateMealDto): Promise<MealResponseDto> {
    const { date, mealType, notes, items } = createMealDto;

    // Check for existing meal (unique constraint: userId, date, mealType)
    const existing = await this.prisma.meal.findUnique({
      where: {
        userId_date_mealType: {
          userId,
          date: new Date(date),
          mealType,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Meal already exists for ${mealType} on ${date}. Use PATCH to add items to existing meal.`,
      );
    }

    // Validate items if provided
    if (items && items.length > 0) {
      await this.validateMealItems(items);
    }

    // Create meal with items in a transaction
    const meal = await this.prisma.meal.create({
      data: {
        userId,
        date: new Date(date),
        mealType,
        notes,
        items: items
          ? {
              create: items.map((item) => ({
                foodId: item.foodId,
                servingId: item.servingId,
                quantity: item.quantity ?? 1.0,
                notes: item.notes,
                isEstimated: item.isEstimated ?? false,
              })),
            }
          : undefined,
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

    return this.formatMealResponse(meal);
  }

  /**
   * Update meal notes
   */
  async update(userId: string, id: string, notes: string): Promise<MealResponseDto> {
    // Verify meal exists and user owns it
    const meal = await this.prisma.meal.findFirst({
      where: { id, userId },
    });

    if (!meal) {
      throw new NotFoundException(`Meal with ID ${id} not found`);
    }

    const updated = await this.prisma.meal.update({
      where: { id },
      data: { notes },
      include: {
        items: {
          include: {
            food: true,
            serving: true,
          },
        },
      },
    });

    return this.formatMealResponse(updated);
  }

  /**
   * Delete meal (cascade deletes items)
   */
  async delete(userId: string, id: string): Promise<void> {
    // Verify meal exists and user owns it
    const meal = await this.prisma.meal.findFirst({
      where: { id, userId },
    });

    if (!meal) {
      throw new NotFoundException(`Meal with ID ${id} not found`);
    }

    // Delete meal (items cascade automatically)
    await this.prisma.meal.delete({
      where: { id },
    });
  }

  /**
   * Add item to existing meal (or create meal if it doesn't exist)
   */
  async addItem(userId: string, mealId: string, addItemDto: AddMealItemDto): Promise<MealResponseDto> {
    // Verify meal exists and user owns it
    const meal = await this.prisma.meal.findFirst({
      where: { id: mealId, userId },
    });

    if (!meal) {
      throw new NotFoundException(`Meal with ID ${mealId} not found`);
    }

    // Validate food and serving exist and are related
    await this.validateMealItems([addItemDto]);

    // Add item to meal
    await this.prisma.mealItem.create({
      data: {
        mealId,
        foodId: addItemDto.foodId,
        servingId: addItemDto.servingId,
        quantity: addItemDto.quantity ?? 1.0,
        notes: addItemDto.notes,
        isEstimated: addItemDto.isEstimated ?? false,
      },
    });

    // Return updated meal with all items
    return this.findOne(userId, mealId);
  }

  /**
   * Update meal item (quantity, notes, isEstimated)
   */
  async updateItem(userId: string, itemId: string, updateItemDto: UpdateMealItemDto): Promise<MealResponseDto> {
    // Find item and verify user owns the parent meal
    const item = await this.prisma.mealItem.findFirst({
      where: {
        id: itemId,
        meal: {
          userId,
        },
      },
      include: {
        meal: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Meal item with ID ${itemId} not found`);
    }

    // Update item
    await this.prisma.mealItem.update({
      where: { id: itemId },
      data: {
        quantity: updateItemDto.quantity,
        notes: updateItemDto.notes,
        isEstimated: updateItemDto.isEstimated,
      },
    });

    // Return updated meal
    return this.findOne(userId, item.mealId);
  }

  /**
   * Delete meal item (auto-delete meal if no items remain)
   */
  async deleteItem(userId: string, itemId: string): Promise<void> {
    // Find item and verify user owns the parent meal
    const item = await this.prisma.mealItem.findFirst({
      where: {
        id: itemId,
        meal: {
          userId,
        },
      },
      include: {
        meal: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Meal item with ID ${itemId} not found`);
    }

    // Delete the item
    await this.prisma.mealItem.delete({
      where: { id: itemId },
    });

    // Auto-delete meal if no items remain
    if (item.meal.items.length === 1) {
      // This was the last item
      await this.prisma.meal.delete({
        where: { id: item.mealId },
      });
    }
  }

  /**
   * Validate that food and serving exist and serving belongs to food
   */
  private async validateMealItems(items: AddMealItemDto[]): Promise<void> {
    for (const item of items) {
      // Check food exists
      const food = await this.prisma.food.findUnique({
        where: { id: item.foodId },
      });

      if (!food) {
        throw new BadRequestException(`Food with ID ${item.foodId} not found`);
      }

      // Check serving exists and belongs to food
      const serving = await this.prisma.serving.findUnique({
        where: { id: item.servingId },
      });

      if (!serving) {
        throw new BadRequestException(`Serving with ID ${item.servingId} not found`);
      }

      if (serving.foodId !== item.foodId) {
        throw new BadRequestException(
          `Serving ${item.servingId} does not belong to food ${item.foodId}`,
        );
      }
    }
  }

  /**
   * Calculate goal vs actual progress
   */
  private calculateGoalProgress(totals: NutritionTotalsDto, goal: any): NutritionGoalProgressDto {
    return {
      calories: this.calculateMacroProgress(totals.calories, goal.caloriesTarget),
      protein: this.calculateMacroProgress(totals.protein, goal.proteinTarget),
      carbs: this.calculateMacroProgress(totals.carbs, goal.carbsTarget),
      fat: this.calculateMacroProgress(totals.fat, goal.fatTarget),
    };
  }

  /**
   * Calculate progress for a single macro
   */
  private calculateMacroProgress(actual: number, target: number | null): MacroProgressDto {
    const percentage = target && target > 0 ? Math.round((actual / target) * 1000) / 10 : null;

    return {
      target,
      actual: Math.round(actual * 10) / 10,
      percentage,
    };
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
