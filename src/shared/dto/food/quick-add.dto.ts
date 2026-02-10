import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { MealType } from '../../entities';
import { CreateFoodDto } from './create-food.dto';

/**
 * Quick-add flow: Create food + serving + log to meal in one API call
 * Used when user searches but doesn't find a food and wants to log it immediately
 */
export class QuickAddDto {
  @ApiProperty({
    description: 'Food details',
    type: CreateFoodDto,
  })
  @ValidateNested()
  @Type(() => CreateFoodDto)
  food: CreateFoodDto;

  @ApiProperty({
    description: 'Serving size (numeric value)',
    example: 100,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  servingSize: number;

  @ApiProperty({
    description: 'Serving unit (e.g., "g", "ml", "oz", "cup")',
    example: 'g',
  })
  @IsString()
  @IsNotEmpty()
  servingUnit: string;

  @ApiProperty({
    description: 'Quantity multiplier for the meal item',
    example: 1.0,
    default: 1.0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  quantity?: number;

  @ApiProperty({
    description: 'Meal type to log this food to',
    enum: MealType,
    example: MealType.LUNCH,
  })
  @IsEnum(MealType)
  mealType: MealType;

  @ApiProperty({
    description: 'Date for the meal (ISO 8601 date format)',
    example: '2026-02-11',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Optional notes for the meal item',
    example: 'Estimated portion',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
