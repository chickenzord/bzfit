import { ApiProperty } from '@nestjs/swagger';

export class MacroProgressDto {
  @ApiProperty({ description: 'Target value', example: 2000, nullable: true })
  target: number | null;

  @ApiProperty({ description: 'Actual value consumed', example: 1850 })
  actual: number;

  @ApiProperty({ description: 'Percentage of target achieved', example: 92.5, nullable: true })
  percentage: number | null;
}

export class NutritionGoalProgressDto {
  @ApiProperty({ description: 'Calories progress', type: MacroProgressDto })
  calories: MacroProgressDto;

  @ApiProperty({ description: 'Protein progress', type: MacroProgressDto })
  protein: MacroProgressDto;

  @ApiProperty({ description: 'Carbs progress', type: MacroProgressDto })
  carbs: MacroProgressDto;

  @ApiProperty({ description: 'Fat progress', type: MacroProgressDto })
  fat: MacroProgressDto;
}
