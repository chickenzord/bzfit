import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('../../../../../package.json') as { version: string };

@ApiTags('server')
@Controller('server')
export class ServerController {
  @Get('info')
  @ApiOperation({ summary: 'Public server info — BzFit identity and feature flags (no auth required)' })
  getInfo() {
    return {
      name: 'BzFit',
      version,
      registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
    };
  }
}
