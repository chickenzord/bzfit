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

  @ApiProperty({ required: false })
  variant?: string;

  @ApiProperty({ required: false })
  brand?: string;

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

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty({ required: false })
  calories?: number;

  @ApiProperty({ required: false })
  protein?: number;

  @ApiProperty({ required: false })
  carbs?: number;

  @ApiProperty({ required: false })
  fat?: number;

  @ApiProperty({ required: false })
  saturatedFat?: number;

  @ApiProperty({ required: false })
  transFat?: number;

  @ApiProperty({ required: false })
  fiber?: number;

  @ApiProperty({ required: false })
  sugar?: number;

  @ApiProperty({ required: false })
  sodium?: number;

  @ApiProperty({ required: false })
  cholesterol?: number;

  @ApiProperty({ required: false })
  vitaminA?: number;

  @ApiProperty({ required: false })
  vitaminC?: number;

  @ApiProperty({ required: false })
  calcium?: number;

  @ApiProperty({ required: false })
  iron?: number;

  @ApiProperty({ enum: ServingStatus })
  status: ServingStatus;

  @ApiProperty({ required: false })
  dataSource?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
