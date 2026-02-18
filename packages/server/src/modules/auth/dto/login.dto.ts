import { createZodDto } from 'nestjs-zod';
import { LoginSchema } from '@bzfit/shared';

export class LoginDto extends createZodDto(LoginSchema) {}
