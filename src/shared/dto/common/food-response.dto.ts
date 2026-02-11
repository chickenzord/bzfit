import { ApiProperty } from '@nestjs/swagger';
import { ServingStatus } from '../../entities';

/**
 * Food with its servings
 */
export class FoodResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  variant: string | null;

  @ApiProperty({ required: false, nullable: true })
  brand: string | null;

  @ApiProperty({
    description: 'Available serving sizes',
    type: 'array',
  })
  servings: ServingResponseDto[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

/**
 * Serving details
 */
export class ServingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  foodId: string;

  @ApiProperty({ required: false, nullable: true })
  name: string | null;

  @ApiProperty()
  size: number;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty({ required: false, nullable: true })
  calories: number | null;

  @ApiProperty({ required: false, nullable: true })
  protein: number | null;

  @ApiProperty({ required: false, nullable: true })
  carbs: number | null;

  @ApiProperty({ required: false, nullable: true })
  fat: number | null;

  @ApiProperty({ required: false, nullable: true })
  saturatedFat: number | null;

  @ApiProperty({ required: false, nullable: true })
  transFat: number | null;

  @ApiProperty({ required: false, nullable: true })
  fiber: number | null;

  @ApiProperty({ required: false, nullable: true })
  sugar: number | null;

  @ApiProperty({ required: false, nullable: true })
  sodium: number | null;

  @ApiProperty({ required: false, nullable: true })
  cholesterol: number | null;

  @ApiProperty({ required: false, nullable: true })
  vitaminA: number | null;

  @ApiProperty({ required: false, nullable: true })
  vitaminC: number | null;

  @ApiProperty({ required: false, nullable: true })
  calcium: number | null;

  @ApiProperty({ required: false, nullable: true })
  iron: number | null;

  @ApiProperty({ enum: ServingStatus })
  status: ServingStatus;

  @ApiProperty({ required: false, nullable: true })
  dataSource: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
