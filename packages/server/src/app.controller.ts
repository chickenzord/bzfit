import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('system')
@Controller()
export class AppController {
  @Get('ping')
  @ApiOperation({ summary: 'Health check — verify server is reachable (no auth required)' })
  ping() {
    return { ok: true };
  }
}
