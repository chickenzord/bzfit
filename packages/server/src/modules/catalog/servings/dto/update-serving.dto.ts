import { createZodDto } from 'nestjs-zod';
import { UpdateServingSchema } from '@bzfit/shared';

export class UpdateServingDto extends createZodDto(UpdateServingSchema) {}
