import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateFoodDto } from './create-food.dto';

/**
 * All fields are optional for PATCH updates
 */
export class UpdateFoodDto extends PartialType(CreateFoodDto) {}
