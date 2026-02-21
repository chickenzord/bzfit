import { createZodDto } from 'nestjs-zod';
import { ChangePasswordSchema } from '@bzfit/shared';

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
