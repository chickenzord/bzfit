import { Controller, Get, Post, Patch, Delete, Query, Param, Body, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { MealsService } from './meals.service';
import { JwtAuthGuard } from '../../auth/guards';
import { MealResponseDto, CreateMealDto, AddMealItemDto, UpdateMealItemDto, QuickAddDto } from '../../../../shared/dto';

@ApiTags('nutrition')
@Controller('nutrition/meals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MealsController {
  constructor(private mealsService: MealsService) {}

  @Get()
  @ApiOperation({ summary: 'List meals with optional filters' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'mealType', required: false, enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'], description: 'Filter by meal type' })
  @ApiResponse({ status: 200, description: 'List of meals', type: [MealResponseDto] })
  async findAll(
    @Request() req,
    @Query('date') date?: string,
    @Query('mealType') mealType?: string,
  ) {
    return this.mealsService.findAll(req.user.id, date, mealType);
  }

  @Get('daily-summary')
  @ApiOperation({ summary: 'Get daily summary: all meals for a specific date with totals' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'Date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Daily meals with nutrition totals' })
  async getDailySummary(
    @Request() req,
    @Query('date') date: string,
  ) {
    return this.mealsService.getDailySummary(req.user.id, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single meal by ID' })
  @ApiResponse({ status: 200, description: 'Meal details with items and nutrition', type: MealResponseDto })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.mealsService.findOne(req.user.id, id);
  }

  @Post('quick-add')
  @ApiOperation({
    summary: 'Quick-add: Create food + serving + log to meal in one call',
    description:
      'Used when user searches but doesn\'t find a food and wants to log it immediately. ' +
      'Creates food (or reuses existing), creates serving with NEEDS_REVIEW status, ' +
      'finds or creates meal, and adds item with isEstimated=true. All in one atomic transaction.',
  })
  @ApiBody({ type: QuickAddDto })
  @ApiResponse({ status: 201, description: 'Food created and logged successfully', type: MealResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input (bad date format, invalid mealType, or negative serving size)' })
  async quickAdd(@Request() req, @Body() quickAddDto: QuickAddDto) {
    return this.mealsService.quickAdd(req.user.id, quickAddDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new meal with optional initial items' })
  @ApiBody({ type: CreateMealDto })
  @ApiResponse({ status: 201, description: 'Meal created successfully', type: MealResponseDto })
  @ApiResponse({ status: 400, description: 'Meal already exists for this date and mealType' })
  async create(@Request() req, @Body() createMealDto: CreateMealDto) {
    return this.mealsService.create(req.user.id, createMealDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update meal notes' })
  @ApiBody({ schema: { type: 'object', properties: { notes: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Meal updated successfully', type: MealResponseDto })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body('notes') notes: string,
  ) {
    return this.mealsService.update(req.user.id, id, notes);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete meal (cascade deletes all items)' })
  @ApiResponse({ status: 204, description: 'Meal deleted successfully' })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  async delete(@Request() req, @Param('id') id: string) {
    await this.mealsService.delete(req.user.id, id);
  }

  @Post(':mealId/items')
  @ApiOperation({ summary: 'Add item to existing meal' })
  @ApiBody({ type: AddMealItemDto })
  @ApiResponse({ status: 201, description: 'Item added successfully', type: MealResponseDto })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  @ApiResponse({ status: 400, description: 'Invalid food or serving ID' })
  async addItem(
    @Request() req,
    @Param('mealId') mealId: string,
    @Body() addItemDto: AddMealItemDto,
  ) {
    return this.mealsService.addItem(req.user.id, mealId, addItemDto);
  }
}
