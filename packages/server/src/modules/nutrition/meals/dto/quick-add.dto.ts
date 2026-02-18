import { createZodDto } from 'nestjs-zod';
import { QuickAddSchema } from '@bzfit/shared';

export class QuickAddDto extends createZodDto(QuickAddSchema) {}
