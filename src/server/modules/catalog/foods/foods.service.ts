import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FoodResponseDto, ServingResponseDto } from '../../../../shared/dto';

@Injectable()
export class FoodsService {
  constructor(private prisma: PrismaService) {}

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
          createdAt: 'desc',
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
   * Get serving by ID
   */
  async findServing(id: string): Promise<ServingResponseDto> {
    const serving = await this.prisma.serving.findUnique({
      where: { id },
    });

    if (!serving) {
      throw new NotFoundException(`Serving with ID ${id} not found`);
    }

    return this.formatServingResponse(serving);
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
