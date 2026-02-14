import { ApiProperty } from '@nestjs/swagger';

export class GoalResponseDto {
  @ApiProperty({ description: 'Goal ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({ description: 'Daily calorie target (kcal)', example: 2000, nullable: true })
  caloriesTarget: number | null;

  @ApiProperty({ description: 'Daily protein target (grams)', example: 80, nullable: true })
  proteinTarget: number | null;

  @ApiProperty({ description: 'Daily carbs target (grams)', example: 250, nullable: true })
  carbsTarget: number | null;

  @ApiProperty({ description: 'Daily fat target (grams)', example: 70, nullable: true })
  fatTarget: number | null;

  @ApiProperty({ description: 'Daily fiber target (grams)', example: 25, nullable: true })
  fiberTarget: number | null;

  @ApiProperty({ description: 'Maximum daily sugar (grams)', example: 50, nullable: true })
  sugarTarget: number | null;

  @ApiProperty({ description: 'Maximum daily sodium (mg)', example: 2300, nullable: true })
  sodiumTarget: number | null;

  @ApiProperty({ description: 'Goal start date', example: '2026-02-14T00:00:00.000Z' })
  startDate: string;

  @ApiProperty({ description: 'Goal end date (null = ongoing)', example: null, nullable: true })
  endDate: string | null;

  @ApiProperty({ description: 'Whether this goal is currently active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Created timestamp', example: '2026-02-14T08:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last updated timestamp', example: '2026-02-14T08:00:00.000Z' })
  updatedAt: string;
}
