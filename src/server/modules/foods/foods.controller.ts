import { Controller, Get, Query, Param, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FoodsService } from './foods.service';
import { JwtAuthGuard } from '../auth/guards';
import { FoodResponseDto, ServingResponseDto, PaginatedResponseDto } from '../../../shared/dto';

@ApiTags('foods')
@Controller('foods')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FoodsController {
  constructor(private foodsService: FoodsService) {}

  @Get()
  @ApiOperation({ summary: 'List all foods' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Paginated list of foods', type: PaginatedResponseDto })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.foodsService.findAll(page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search foods by name, brand, or variant' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'List of matching foods', type: [FoodResponseDto] })
  async search(@Query('q') query: string) {
    return this.foodsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single food by ID' })
  @ApiResponse({ status: 200, description: 'Food details with servings', type: FoodResponseDto })
  @ApiResponse({ status: 404, description: 'Food not found' })
  async findOne(@Param('id') id: string) {
    return this.foodsService.findOne(id);
  }
}

@ApiTags('servings')
@Controller('servings')
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
