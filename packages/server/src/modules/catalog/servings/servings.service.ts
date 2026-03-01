import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ServingResponseDto, CreateServingDto, UpdateServingDto, ApplyNutritionDto, NutritionImportResponseDto } from '@bzfit/shared';
import { ServingStatus } from '@prisma/client';
import { DataProviderRegistry } from '../providers/data-provider.registry';
import { NutritionDataContext } from '../providers/data-provider.interface';

@Injectable()
export class ServingsService {
  constructor(
    private prisma: PrismaService,
    private readonly providerRegistry: DataProviderRegistry,
  ) {}

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

    await this.prisma.mealItem.deleteMany({ where: { servingId: id } });
    await this.prisma.serving.delete({ where: { id } });
    return { id };
  }

  /**
   * Count meal items that reference this serving
   */
  async getMealItemCount(id: string): Promise<{ mealItemCount: number }> {
    const serving = await this.prisma.serving.findUnique({ where: { id } });
    if (!serving) {
      throw new NotFoundException(`Serving with ID ${id} not found`);
    }
    const mealItemCount = await this.prisma.mealItem.count({ where: { servingId: id } });
    return { mealItemCount };
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
   * Mark a serving as verified, optionally updating nutrition data
   */
  async verifyServing(id: string, data?: UpdateServingDto): Promise<ServingResponseDto> {
    const existingServing = await this.prisma.serving.findUnique({
      where: { id },
    });

    if (!existingServing) {
      throw new NotFoundException(`Serving with ID ${id} not found`);
    }

    const updateData: any = {
      status: ServingStatus.VERIFIED,
    };

    // If nutrition data is provided, update it along with status
    if (data) {
      if (data.name !== undefined) updateData.name = data.name;
      if (data.size !== undefined) updateData.size = data.size;
      if (data.unit !== undefined) updateData.unit = data.unit;
      if (data.calories !== undefined) updateData.calories = data.calories;
      if (data.protein !== undefined) updateData.protein = data.protein;
      if (data.carbs !== undefined) updateData.carbs = data.carbs;
      if (data.fat !== undefined) updateData.fat = data.fat;
      if (data.saturatedFat !== undefined) updateData.saturatedFat = data.saturatedFat;
      if (data.transFat !== undefined) updateData.transFat = data.transFat;
      if (data.fiber !== undefined) updateData.fiber = data.fiber;
      if (data.sugar !== undefined) updateData.sugar = data.sugar;
      if (data.sodium !== undefined) updateData.sodium = data.sodium;
      if (data.cholesterol !== undefined) updateData.cholesterol = data.cholesterol;
      if (data.vitaminA !== undefined) updateData.vitaminA = data.vitaminA;
      if (data.vitaminC !== undefined) updateData.vitaminC = data.vitaminC;
      if (data.calcium !== undefined) updateData.calcium = data.calcium;
      if (data.iron !== undefined) updateData.iron = data.iron;
      if (data.dataSource !== undefined) updateData.dataSource = data.dataSource;
      if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    }

    const serving = await this.prisma.serving.update({
      where: { id },
      data: updateData,
    });

    if (data?.isDefault) {
      await this.ensureSingleDefaultServing(serving.foodId, serving.id);
    }

    return this.formatServingResponse(serving);
  }

  /**
   * Fetch nutrition candidates from an external provider for a given serving.
   * Does not modify any data — the caller reviews results and calls applyNutrition separately.
   */
  async importNutrition(
    servingId: string,
    providerName: string | undefined,
    extraContext: string | undefined,
  ): Promise<NutritionImportResponseDto> {
    const serving = await this.prisma.serving.findUnique({
      where: { id: servingId },
      include: { food: true },
    });
    if (!serving) throw new NotFoundException(`Serving with ID ${servingId} not found`);

    const provider = providerName
      ? this.providerRegistry.get(providerName)
      : this.providerRegistry.getDefault('nutrition');

    const context: NutritionDataContext = {
      foodName: serving.food.name,
      foodBrand: serving.food.brand,
      foodVariant: serving.food.variant,
      servingName: serving.name,
      servingSize: serving.size,
      servingUnit: serving.unit,
      extraContext,
    };

    const results = await provider.fetch(context);

    return {
      provider: provider.name,
      providerKind: provider.kind,
      providerDataType: provider.dataType,
      results,
    };
  }

  /**
   * Apply imported nutrition values to a serving.
   * If resultServingSize is provided and the units match the stored serving,
   * all values are auto-scaled proportionally before writing.
   * Status is NOT changed — the serving remains NEEDS_REVIEW until verified.
   */
  async applyNutrition(servingId: string, data: ApplyNutritionDto): Promise<ServingResponseDto> {
    const serving = await this.prisma.serving.findUnique({ where: { id: servingId } });
    if (!serving) throw new NotFoundException(`Serving with ID ${servingId} not found`);

    const { scaleFactor, scalingNote } = resolveScaling(
      serving.size,
      serving.unit,
      data.resultServingSize,
      data.resultServingUnit,
    );

    const scaled = scaleNutrition(data, scaleFactor);
    const dataSource = buildDataSource(data.dataSource, scalingNote);

    const updated = await this.prisma.serving.update({
      where: { id: servingId },
      data: {
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
        saturatedFat: scaled.saturatedFat,
        transFat: scaled.transFat,
        fiber: scaled.fiber,
        sugar: scaled.sugar,
        sodium: scaled.sodium,
        cholesterol: scaled.cholesterol,
        dataSource,
      },
    });

    return this.formatServingResponse(updated);
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

// ---------------------------------------------------------------------------
// Scaling helpers (module-level, not part of the service class)
// ---------------------------------------------------------------------------

/**
 * Determine the scale factor and a human-readable note for the dataSource field.
 * Scale factor of 1 means no transformation needed.
 */
function resolveScaling(
  storedSize: number,
  storedUnit: string,
  resultSize: number | undefined,
  resultUnit: string | undefined,
): { scaleFactor: number; scalingNote: string | null } {
  if (resultSize == null || resultUnit == null) {
    return { scaleFactor: 1, scalingNote: null };
  }

  const unitsMatch = storedUnit.toLowerCase().trim() === resultUnit.toLowerCase().trim();
  if (!unitsMatch) {
    // Incompatible units — cannot safely auto-scale; apply as-is
    return { scaleFactor: 1, scalingNote: null };
  }

  if (resultSize === storedSize) {
    return { scaleFactor: 1, scalingNote: null };
  }

  const scaleFactor = storedSize / resultSize;
  const scalingNote = `scaled from ${resultSize}${resultUnit} to ${storedSize}${storedUnit}`;
  return { scaleFactor, scalingNote };
}

type NutritionFields = Pick<
  ApplyNutritionDto,
  'calories' | 'protein' | 'carbs' | 'fat' | 'saturatedFat' | 'transFat' | 'fiber' | 'sugar' | 'sodium' | 'cholesterol'
>;

function scaleNutrition(data: NutritionFields, factor: number): NutritionFields {
  if (factor === 1) return data;
  const scale = (v: number | undefined) => (v != null ? Math.round(v * factor * 100) / 100 : undefined);
  return {
    calories: scale(data.calories),
    protein: scale(data.protein),
    carbs: scale(data.carbs),
    fat: scale(data.fat),
    saturatedFat: scale(data.saturatedFat),
    transFat: scale(data.transFat),
    fiber: scale(data.fiber),
    sugar: scale(data.sugar),
    sodium: scale(data.sodium),
    cholesterol: scale(data.cholesterol),
  };
}

function buildDataSource(base: string | undefined, scalingNote: string | null): string | undefined {
  if (!base) return undefined;
  return scalingNote ? `${base} (${scalingNote})` : base;
}
