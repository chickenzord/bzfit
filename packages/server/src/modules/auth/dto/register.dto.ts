import { createZodDto } from 'nestjs-zod';
import { RegisterSchema } from '@bzfit/shared';

export class RegisterDto extends createZodDto(RegisterSchema) {}
