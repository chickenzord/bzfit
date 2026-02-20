import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../../auth/guards';
import { CreateGoalDto, UpdateGoalDto } from './dto';

@ApiTags('nutrition')
@Controller('nutrition/goals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get active nutrition goal on a specific date (defaults to today)' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Active goal or null' })
  async getActive(@Request() req, @Query('date') date?: string) {
    return this.goalsService.getActive(req.user.id, date);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all goals ordered by startDate descending' })
  @ApiResponse({ status: 200, description: 'List of all goals' })
  async getAll(@Request() req) {
    return this.goalsService.getAll(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new goal (closes the current open goal if any)' })
  @ApiBody({ type: CreateGoalDto })
  @ApiResponse({ status: 201, description: 'Goal created successfully' })
  @ApiResponse({ status: 400, description: 'At least one target must be set' })
  @ApiResponse({ status: 409, description: 'A goal with that start date already exists' })
  async create(@Request() req, @Body() createGoalDto: CreateGoalDto) {
    return this.goalsService.create(req.user.id, createGoalDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update goal targets (startDate is immutable)' })
  @ApiBody({ type: UpdateGoalDto })
  @ApiResponse({ status: 200, description: 'Goal updated successfully' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.update(req.user.id, id, updateGoalDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete the latest goal (past goals cannot be deleted)' })
  @ApiResponse({ status: 204, description: 'Goal deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only the latest goal can be deleted' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async delete(@Request() req, @Param('id') id: string) {
    await this.goalsService.delete(req.user.id, id);
  }
}
