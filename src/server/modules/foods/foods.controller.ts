import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FoodsService } from './foods.service';

@ApiTags('foods')
@Controller('foods')
export class FoodsController {
  constructor(private foodsService: FoodsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search foods' })
  async search(@Query('q') query: string) {
    // TODO: Implement search
    return { message: 'Food search - to be implemented', query };
  }

  @Post('quick-add')
  @ApiOperation({ summary: 'Quick add food with serving' })
  async quickAdd(@Body() data: any) {
    // TODO: Implement quick-add
    return { message: 'Quick-add - to be implemented' };
  }

  @Get('needs-review')
  @ApiOperation({ summary: 'Get foods needing nutrition review' })
  async needsReview() {
    // TODO: Implement needs-review list
    return { message: 'Needs review list - to be implemented' };
  }
}
