import { createZodDto } from 'nestjs-zod';
import { UpdateGoalSchema } from '@bzfit/shared';

export class UpdateGoalDto extends createZodDto(UpdateGoalSchema) {}
