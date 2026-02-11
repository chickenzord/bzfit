import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards';
import { ServingResponseDto } from '../../../../shared/dto';
import { FoodsService } from '../foods/foods.service';

@ApiTags('catalog')
@Controller('catalog/servings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServingsController {
  constructor(private foodsService: FoodsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get serving by ID' })
  @ApiResponse({ status: 200, description: 'Serving details', type: ServingResponseDto })
  @ApiResponse({ status: 404, description: 'Serving not found' })
  async findOne(@Param('id') id: string) {
    return this.foodsService.findServing(id);
  }
}
