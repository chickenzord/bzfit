import { createZodDto } from 'nestjs-zod';
import { AddMealItemSchema } from '@bzfit/shared';

export class AddMealItemDto extends createZodDto(AddMealItemSchema) {}
