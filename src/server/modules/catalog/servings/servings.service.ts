import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ServingResponseDto, CreateServingDto, UpdateServingDto } from '../../../../shared/dto';
import { ServingStatus } from '@prisma/client';

@Injectable()
export class ServingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new serving for a food
   */
  async createServing(foodId: string, data: CreateServingDto): Promise<ServingResponseDto> {
    const food = await this.prisma.food.findUnique({ where: { id: foodId } });
    if (!food) {
      throw new NotFoundException(`Food with ID ${foodId} not found`);
    }

    // Business rule: new servings default to NEEDS_REVIEW
    const serving = await this.prisma.serving.create({
      data: {
        foodId: foodId,
        name: data.name,
        size: data.size,
        unit: data.unit,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        saturatedFat: data.saturatedFat,
        transFat: data.transFat,
        fiber: data.fiber,
        sugar: data.sugar,
        sodium: data.sodium,
        cholesterol: data.cholesterol,
        vitaminA: data.vitaminA,
        vitaminC: data.vitaminC,
        calcium: data.calcium,
        iron: data.iron,
        status: ServingStatus.NEEDS_REVIEW, // Default status
        dataSource: data.dataSource,
        isDefault: data.isDefault,
      },
    });

    if (data.isDefault) {
        await this.ensureSingleDefaultServing(foodId, serving.id);
    }

    return this.formatServingResponse(serving);
  }

  /**
   * Update an existing serving
   */
  async updateServing(id: string, data: UpdateServingDto): Promise<ServingResponseDto> {
    const existingServing = await this.prisma.serving.findUnique({
      where: { id },
    });

    if (!existingServing) {
      throw new NotFoundException(`Serving with ID ${id} not found`);
    }

    const serving = await this.prisma.serving.update({
      where: { id },
      data: {
        name: data.name,
        size: data.size,
        unit: data.unit,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        saturatedFat: data.saturatedFat,
        transFat: data.transFat,
        fiber: data.fiber,
        sugar: data.sugar,
        sodium: data.sodium,
        cholesterol: data.cholesterol,
        vitaminA: data.vitaminA,
        vitaminC: data.vitaminC,
        calcium: data.calcium,
        iron: data.iron,
        status: data.status,
        dataSource: data.dataSource,
        isDefault: data.isDefault,
      },
    });

    if (data.isDefault) {
        await this.ensureSingleDefaultServing(serving.foodId, serving.id);
    }

    return this.formatServingResponse(serving);
  }

  /**
   * Remove a serving
   */
  async removeServing(id: string): Promise<{ id: string }> {
    const existingServing = await this.prisma.serving.findUnique({
      where: { id },
    });

    if (!existingServing) {
      throw new NotFoundException(`Serving with ID ${id} not found`);
    }

    await this.prisma.serving.delete({
      where: { id },
    });
    return { id };
  }

  /**
   * Get serving by ID
   */
  async findOne(id: string): Promise<ServingResponseDto> {
    const serving = await this.prisma.serving.findUnique({
      where: { id },
    });

    if (!serving) {
      throw new NotFoundException(`Serving with ID ${id} not found`);
    }

    return this.formatServingResponse(serving);
  }

  /**
   * Helper to ensure only one default serving per food
   */
  private async ensureSingleDefaultServing(foodId: string, currentServingId: string) {
    await this.prisma.serving.updateMany({
      where: {
        foodId: foodId,
        isDefault: true,
        id: {
          not: currentServingId,
        },
      },
      data: {
        isDefault: false,
      },
    });
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
