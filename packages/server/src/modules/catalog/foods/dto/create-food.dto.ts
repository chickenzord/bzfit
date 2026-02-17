import { createZodDto } from 'nestjs-zod';
import { CreateFoodSchema } from '@bzfit/shared';

export class CreateFoodDto extends createZodDto(CreateFoodSchema) {}
