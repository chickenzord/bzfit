import { createZodDto } from 'nestjs-zod';
import { CreateGoalSchema } from '@bzfit/shared';

export class CreateGoalDto extends createZodDto(CreateGoalSchema) {}
