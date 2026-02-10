import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MealType } from '../../entities';
import { AddMealItemDto } from './add-meal-item.dto';

export class CreateMealDto {
  @ApiProperty({
    description: 'Date of the meal (ISO 8601 date format)',
    example: '2026-02-11',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Type of meal',
    enum: MealType,
    example: MealType.LUNCH,
  })
  @IsEnum(MealType)
  mealType: MealType;

  @ApiProperty({
    description: 'Optional notes about the meal',
    example: 'Business lunch',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Initial meal items to add',
    type: [AddMealItemDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddMealItemDto)
  @IsOptional()
  items?: AddMealItemDto[];
}
