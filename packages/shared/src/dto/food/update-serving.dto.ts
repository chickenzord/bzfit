import { PartialType } from '@nestjs/swagger';
import { CreateServingDto } from './create-serving.dto';
import { OmitType } from '@nestjs/swagger';

/**
 * All fields are optional for PATCH updates, except foodId which cannot be changed
 */
export class UpdateServingDto extends PartialType(
  OmitType(CreateServingDto, ['foodId'] as const),
) {}
