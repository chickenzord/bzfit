import { createZodDto } from 'nestjs-zod';
import { CreateApiKeySchema } from '@bzfit/shared';

export class CreateApiKeyDto extends createZodDto(CreateApiKeySchema) {}
