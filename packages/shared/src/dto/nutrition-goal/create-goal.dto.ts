import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({
    description: 'Daily calorie target (kcal)',
    example: 2000,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  caloriesTarget?: number;

  @ApiProperty({
    description: 'Daily protein target (grams)',
    example: 80,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  proteinTarget?: number;

  @ApiProperty({
    description: 'Daily carbs target (grams)',
    example: 250,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  carbsTarget?: number;

  @ApiProperty({
    description: 'Daily fat target (grams)',
    example: 70,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  fatTarget?: number;

  @ApiProperty({
    description: 'Daily fiber target (grams)',
    example: 25,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  fiberTarget?: number;

  @ApiProperty({
    description: 'Maximum daily sugar (grams)',
    example: 50,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sugarTarget?: number;

  @ApiProperty({
    description: 'Maximum daily sodium (mg)',
    example: 2300,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sodiumTarget?: number;
}
