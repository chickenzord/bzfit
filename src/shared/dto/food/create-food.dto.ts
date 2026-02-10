import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFoodDto {
  @ApiProperty({
    description: 'Food name',
    example: 'French Fries',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Food variant (e.g., "Curly", "Waffle")',
    example: 'Curly',
    required: false,
  })
  @IsString()
  @IsOptional()
  variant?: string;

  @ApiProperty({
    description: 'Brand name',
    example: "McDonald's",
    required: false,
  })
  @IsString()
  @IsOptional()
  brand?: string;
}
