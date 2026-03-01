import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards';
import { DataProviderRegistry } from './data-provider.registry';

@ApiTags('catalog')
@Controller('catalog/providers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProvidersController {
  constructor(private readonly registry: DataProviderRegistry) {}

  @Get()
  @ApiOperation({ summary: 'List all registered data providers and their availability' })
  @ApiResponse({
    status: 200,
    description: 'Provider list',
    schema: {
      type: 'object',
      properties: {
        providers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              displayName: { type: 'string' },
              dataType: { type: 'string', enum: ['nutrition', 'workout'] },
              kind: { type: 'string', enum: ['estimation', 'lookup'] },
              available: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  list() {
    const providers = this.registry.getAll().map((p) => ({
      name: p.name,
      displayName: p.displayName,
      dataType: p.dataType,
      kind: p.kind,
      available: p.isAvailable(),
    }));
    return { providers };
  }
}
