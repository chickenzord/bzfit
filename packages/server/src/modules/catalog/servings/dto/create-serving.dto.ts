import { createZodDto } from 'nestjs-zod';
import { CreateServingSchema } from '@bzfit/shared';

export class CreateServingDto extends createZodDto(CreateServingSchema) {}
