import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../../auth/guards';
import { CreateGoalDto, UpdateGoalDto, GoalResponseDto } from '@bzfit/shared';

@ApiTags('nutrition')
@Controller('nutrition/goals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get active nutrition goal' })
  @ApiResponse({ status: 200, description: 'Active goal or null', type: GoalResponseDto })
  async getActive(@Request() req) {
    return this.goalsService.getActive(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get history of past goals' })
  @ApiResponse({ status: 200, description: 'List of inactive goals', type: [GoalResponseDto] })
  async getHistory(@Request() req) {
    return this.goalsService.getHistory(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update goal (deactivates old, creates new)' })
  @ApiBody({ type: CreateGoalDto })
  @ApiResponse({ status: 201, description: 'Goal created successfully', type: GoalResponseDto })
  @ApiResponse({ status: 400, description: 'At least one target must be set' })
  async create(@Request() req, @Body() createGoalDto: CreateGoalDto) {
    return this.goalsService.createOrUpdate(req.user.id, createGoalDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update active goal' })
  @ApiBody({ type: UpdateGoalDto })
  @ApiResponse({ status: 200, description: 'Goal updated successfully', type: GoalResponseDto })
  @ApiResponse({ status: 404, description: 'Active goal not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.update(req.user.id, id, updateGoalDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Deactivate goal' })
  @ApiResponse({ status: 204, description: 'Goal deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async delete(@Request() req, @Param('id') id: string) {
    await this.goalsService.deactivate(req.user.id, id);
  }
}
