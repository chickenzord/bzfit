import { ApiProperty, PartialType } from '@nestjs/swagger';
import { OmitType } from '@nestjs/swagger';
import { AddMealItemDto } from './add-meal-item.dto';

/**
 * All fields are optional for PATCH updates, except foodId and servingId which cannot be changed
 */
export class UpdateMealItemDto extends PartialType(
  OmitType(AddMealItemDto, ['foodId', 'servingId'] as const),
) {}
