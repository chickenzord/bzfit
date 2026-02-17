import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AddMealItemDto {
  @ApiProperty({
    description: 'Food ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  foodId: string;

  @ApiProperty({
    description: 'Serving ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsNotEmpty()
  servingId: string;

  @ApiProperty({
    description: 'Quantity multiplier (e.g., 1.5 for 1.5 servings)',
    example: 1.0,
    default: 1.0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  quantity?: number;

  @ApiProperty({
    description: 'Optional notes for this item',
    example: 'Extra sauce',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Mark this item as estimated (no exact nutrition data)',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isEstimated?: boolean;
}
