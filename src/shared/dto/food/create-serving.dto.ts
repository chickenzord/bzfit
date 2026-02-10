import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ServingStatus } from '../../entities';

export class CreateServingDto {
  @ApiProperty({
    description: 'Food ID this serving belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  foodId: string;

  @ApiProperty({
    description: 'Serving name (e.g., "Small", "Medium", "Large")',
    example: 'Small',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Serving size (numeric value)',
    example: 71,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  size: number;

  @ApiProperty({
    description: 'Unit of measurement (e.g., "g", "ml", "oz", "cup")',
    example: 'g',
  })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({
    description: 'Is this the default serving size for the food?',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({
    description: 'Calories (kcal)',
    example: 220,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  calories?: number;

  @ApiProperty({
    description: 'Protein (g)',
    example: 2.5,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  protein?: number;

  @ApiProperty({
    description: 'Carbohydrates (g)',
    example: 29,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  carbs?: number;

  @ApiProperty({
    description: 'Fat (g)',
    example: 10,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  fat?: number;

  @ApiProperty({
    description: 'Saturated fat (g)',
    example: 1.5,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  saturatedFat?: number;

  @ApiProperty({
    description: 'Trans fat (g)',
    example: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  transFat?: number;

  @ApiProperty({
    description: 'Fiber (g)',
    example: 2.5,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  fiber?: number;

  @ApiProperty({
    description: 'Sugar (g)',
    example: 0.2,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sugar?: number;

  @ApiProperty({
    description: 'Sodium (mg)',
    example: 150,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sodium?: number;

  @ApiProperty({
    description: 'Cholesterol (mg)',
    example: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  cholesterol?: number;

  @ApiProperty({
    description: 'Vitamin A (μg)',
    example: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  vitaminA?: number;

  @ApiProperty({
    description: 'Vitamin C (mg)',
    example: 5,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  vitaminC?: number;

  @ApiProperty({
    description: 'Calcium (mg)',
    example: 10,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  calcium?: number;

  @ApiProperty({
    description: 'Iron (mg)',
    example: 0.5,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  iron?: number;

  @ApiProperty({
    description: 'Serving status',
    enum: ServingStatus,
    example: ServingStatus.VERIFIED,
    default: ServingStatus.NEEDS_REVIEW,
  })
  @IsEnum(ServingStatus)
  @IsOptional()
  status?: ServingStatus;

  @ApiProperty({
    description: 'Data source (e.g., "USDA", "manual", "user")',
    example: 'manual',
    required: false,
  })
  @IsString()
  @IsOptional()
  dataSource?: string;
}
