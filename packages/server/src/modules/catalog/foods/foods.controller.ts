import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, ParseIntPipe, DefaultValuePipe, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FoodsService } from './foods.service';
import { JwtAuthGuard } from '../../auth/guards';
import { FoodResponseDto, PaginatedResponseDto, CreateFoodDto, UpdateFoodDto } from '@bzfit/shared';

@ApiTags('catalog')
@Controller('catalog/foods')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FoodsController {
  constructor(private foodsService: FoodsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new food' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'The food has been successfully created.', type: FoodResponseDto })
  async create(@Body() createFoodDto: CreateFoodDto) {
    return this.foodsService.createFood(createFoodDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing food' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The food has been successfully updated.', type: FoodResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Food not found' })
  async update(@Param('id') id: string, @Body() updateFoodDto: UpdateFoodDto) {
    return this.foodsService.updateFood(id, updateFoodDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a food' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The food has been successfully deleted.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Food not found' })
  async remove(@Param('id') id: string) {
    return this.foodsService.removeFood(id);
  }

  @Get()
  @ApiOperation({ summary: 'List all foods' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated list of foods', type: PaginatedResponseDto })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.foodsService.findAll(page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search foods by name, brand, or variant' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of matching foods', type: [FoodResponseDto] })
  async search(@Query('q') query: string) {
    return this.foodsService.search(query);
  }

  @Get('needs-review')
  @ApiOperation({ summary: 'Get foods with servings that need review' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of foods with NEEDS_REVIEW servings', type: [FoodResponseDto] })
  async getNeedsReview() {
    return this.foodsService.getNeedsReview();
  }

  @Get('needs-review/count')
  @ApiOperation({ summary: 'Get count of servings needing review' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Count of servings with NEEDS_REVIEW status', schema: { type: 'object', properties: { count: { type: 'number' } } } })
  async getNeedsReviewCount() {
    return this.foodsService.getNeedsReviewCount();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single food by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Food details with servings', type: FoodResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Food not found' })
  async findOne(@Param('id') id: string) {
    return this.foodsService.findOne(id);
  }
}
