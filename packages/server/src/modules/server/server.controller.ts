import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('server')
@Controller('server')
export class ServerController {
  @Get('info')
  @ApiOperation({ summary: 'Public server info — BzFit identity and feature flags (no auth required)' })
  getInfo() {
    return {
      name: 'BzFit',
      version: '0.1.0',
      registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
    };
  }
}
