import { createZodDto } from 'nestjs-zod';
import { CreateMealSchema } from '@bzfit/shared';

export class CreateMealDto extends createZodDto(CreateMealSchema) {}
