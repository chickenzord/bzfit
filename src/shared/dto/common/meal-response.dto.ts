import { ApiProperty } from '@nestjs/swagger';
import { MealType } from '../../entities';

/**
 * Meal with items and nutrition totals
 */
export class MealResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  date: string;

  @ApiProperty({ enum: MealType })
  mealType: MealType;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({
    description: 'Meal items with food and serving details',
    type: 'array',
  })
  items: MealItemResponseDto[];

  @ApiProperty({
    description: 'Aggregated nutrition totals for the meal',
  })
  totals: NutritionTotalsDto;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

/**
 * Meal item with expanded food and serving details
 */
export class MealItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  mealId: string;

  @ApiProperty()
  foodId: string;

  @ApiProperty()
  servingId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  isEstimated: boolean;

  @ApiProperty({
    description: 'Food details',
  })
  food: {
    id: string;
    name: string;
    variant?: string;
    brand?: string;
  };

  @ApiProperty({
    description: 'Serving details',
  })
  serving: {
    id: string;
    name?: string;
    size: number;
    unit: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };

  @ApiProperty({
    description: 'Calculated nutrition for this item (serving * quantity)',
  })
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

/**
 * Aggregated nutrition totals
 */
export class NutritionTotalsDto {
  @ApiProperty()
  calories: number;

  @ApiProperty()
  protein: number;

  @ApiProperty()
  carbs: number;

  @ApiProperty()
  fat: number;
}
