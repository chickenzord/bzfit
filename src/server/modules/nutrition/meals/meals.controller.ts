import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MealsService } from './meals.service';
import { JwtAuthGuard } from '../../auth/guards';
import { MealResponseDto } from '../../../../shared/dto';

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
}
