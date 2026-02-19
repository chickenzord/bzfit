import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FoodResponseDto, CreateFoodDto, UpdateFoodDto, ServingResponseDto } from '@bzfit/shared';

@Injectable()
export class FoodsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new food
   */
  async createFood(data: CreateFoodDto): Promise<FoodResponseDto> {
    const food = await this.prisma.food.create({
      data: {
        name: data.name,
        variant: data.variant,
        brand: data.brand,
      },
      include: {
        servings: true,
      },
    });
    return this.formatFoodResponse(food);
  }

  /**
   * Update an existing food
   */
  async updateFood(id: string, data: UpdateFoodDto): Promise<FoodResponseDto> {
    const existingFood = await this.prisma.food.findUnique({
      where: { id },
    });

    if (!existingFood) {
      throw new NotFoundException(`Food with ID ${id} not found`);
    }

    const food = await this.prisma.food.update({
      where: { id },
      data: {
        name: data.name,
        variant: data.variant,
        brand: data.brand,
      },
      include: {
        servings: true,
      },
    });
    return this.formatFoodResponse(food);
  }

  /**
   * Remove a food
   */
  async removeFood(id: string): Promise<{ id: string }> {
    const existingFood = await this.prisma.food.findUnique({
      where: { id },
    });

    if (!existingFood) {
      throw new NotFoundException(`Food with ID ${id} not found`);
    }

    await this.prisma.food.delete({
      where: { id },
    });
    return { id };
  }

  /**
   * List all foods with pagination
   */
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [foods, total] = await Promise.all([
      this.prisma.food.findMany({
        skip,
        take: limit,
        include: {
          servings: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.food.count(),
    ]);

    return {
      data: foods.map((f) => this.formatFoodResponse(f)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single food by ID with servings
   */
  async findOne(id: string): Promise<FoodResponseDto> {
    const food = await this.prisma.food.findUnique({
      where: { id },
      include: {
        servings: true,
      },
    });

    if (!food) {
      throw new NotFoundException(`Food with ID ${id} not found`);
    }

    return this.formatFoodResponse(food);
  }

  /**
   * Search foods by name, brand, or variant
   * Case-insensitive partial match with relevance ordering
   */
  async search(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.trim().toLowerCase();

    // Fetch all foods and filter in-memory (SQLite doesn't support case-insensitive contains)
    const allFoods = await this.prisma.food.findMany({
      include: {
        servings: true,
      },
    });

    // Filter foods that match the search term
    const matchedFoods = allFoods.filter((food) => {
      const nameLower = food.name.toLowerCase();
      const brandLower = food.brand?.toLowerCase() || '';
      const variantLower = food.variant?.toLowerCase() || '';

      return (
        nameLower.includes(searchTerm) ||
        brandLower.includes(searchTerm) ||
        variantLower.includes(searchTerm)
      );
    });

    // Sort by relevance: exact matches first, then partial matches
    const sorted = matchedFoods.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Exact name match has highest priority
      if (aName === searchTerm && bName !== searchTerm) return -1;
      if (bName === searchTerm && aName !== searchTerm) return 1;

      // Name starts with search term
      if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
      if (bName.startsWith(searchTerm) && !aName.startsWith(searchTerm)) return 1;

      // Alphabetical fallback
      return aName.localeCompare(bName);
    });

    return sorted.map((f) => this.formatFoodResponse(f));
  }

  /**
   * Format food entity to response DTO
   */
  private formatFoodResponse(food: any): FoodResponseDto {
    return {
      id: food.id,
      name: food.name,
      variant: food.variant ?? null,
      brand: food.brand ?? null,
      servings: food.servings ? food.servings.map((s) => this.formatServingResponse(s)) : [],
      createdAt: food.createdAt.toISOString(),
      updatedAt: food.updatedAt.toISOString(),
    };
  }

  /**
   * Get foods with servings that need review
   * Returns foods ordered by recently added/used first
   */
  async getNeedsReview(): Promise<FoodResponseDto[]> {
    const foods = await this.prisma.food.findMany({
      where: {
        servings: {
          some: {
            status: 'NEEDS_REVIEW',
          },
        },
      },
      include: {
        servings: {
          where: {
            status: 'NEEDS_REVIEW',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return foods.map((f) => this.formatFoodResponse(f));
  }

  /**
   * Count servings that need review
   * Fast query for badge display
   */
  async getNeedsReviewCount(): Promise<{ count: number }> {
    const count = await this.prisma.serving.count({
      where: {
        status: 'NEEDS_REVIEW',
      },
    });

    return { count };
  }

  /**
   * Format serving entity to response DTO
   */
  private formatServingResponse(serving: any): ServingResponseDto {
    return {
      id: serving.id,
      foodId: serving.foodId,
      name: serving.name ?? null,
      size: serving.size,
      unit: serving.unit,
      isDefault: serving.isDefault,
      calories: serving.calories ?? null,
      protein: serving.protein ?? null,
      carbs: serving.carbs ?? null,
      fat: serving.fat ?? null,
      saturatedFat: serving.saturatedFat ?? null,
      transFat: serving.transFat ?? null,
      fiber: serving.fiber ?? null,
      sugar: serving.sugar ?? null,
      sodium: serving.sodium ?? null,
      cholesterol: serving.cholesterol ?? null,
      vitaminA: serving.vitaminA ?? null,
      vitaminC: serving.vitaminC ?? null,
      calcium: serving.calcium ?? null,
      iron: serving.iron ?? null,
      status: serving.status,
      dataSource: serving.dataSource ?? null,
      createdAt: serving.createdAt.toISOString(),
      updatedAt: serving.updatedAt.toISOString(),
    };
  }
}



