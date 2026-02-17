import { createZodDto } from 'nestjs-zod';
import { UpdateFoodSchema } from '@bzfit/shared';

export class UpdateFoodDto extends createZodDto(UpdateFoodSchema) {}
