import { createZodDto } from 'nestjs-zod';
import { UpdateMealItemSchema } from '@bzfit/shared';

export class UpdateMealItemDto extends createZodDto(UpdateMealItemSchema) {}
