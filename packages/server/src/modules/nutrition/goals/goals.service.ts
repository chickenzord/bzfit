import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto, GoalResponseDto } from '@bzfit/shared';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user's active nutrition goal
   */
  async getActive(userId: string): Promise<GoalResponseDto | null> {
    const goal = await this.prisma.nutritionGoal.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    return goal ? this.formatGoalResponse(goal) : null;
  }

  /**
   * Get history of past goals
   */
  async getHistory(userId: string): Promise<GoalResponseDto[]> {
    const goals = await this.prisma.nutritionGoal.findMany({
      where: {
        userId,
        isActive: false,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return goals.map((goal) => this.formatGoalResponse(goal));
  }

  /**
   * Create or update goal (deactivates old goal, creates new)
   */
  async createOrUpdate(userId: string, createGoalDto: CreateGoalDto): Promise<GoalResponseDto> {
    // Validate at least one target is set
    const hasTarget =
      createGoalDto.caloriesTarget ||
      createGoalDto.proteinTarget ||
      createGoalDto.carbsTarget ||
      createGoalDto.fatTarget ||
      createGoalDto.fiberTarget ||
      createGoalDto.sugarTarget ||
      createGoalDto.sodiumTarget;

    if (!hasTarget) {
      throw new BadRequestException('At least one nutrition target must be set');
    }

    // Deactivate existing active goal (if any)
    await this.prisma.nutritionGoal.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });

    // Create new active goal
    const goal = await this.prisma.nutritionGoal.create({
      data: {
        userId,
        ...createGoalDto,
        isActive: true,
      },
    });

    return this.formatGoalResponse(goal);
  }

  /**
   * Update active goal
   */
  async update(userId: string, id: string, updateGoalDto: UpdateGoalDto): Promise<GoalResponseDto> {
    // Verify goal exists and user owns it
    const goal = await this.prisma.nutritionGoal.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!goal) {
      throw new NotFoundException(`Active goal with ID ${id} not found`);
    }

    // Update goal
    const updated = await this.prisma.nutritionGoal.update({
      where: { id },
      data: updateGoalDto,
    });

    return this.formatGoalResponse(updated);
  }

  /**
   * Deactivate goal
   */
  async deactivate(userId: string, id: string): Promise<void> {
    // Verify goal exists and user owns it
    const goal = await this.prisma.nutritionGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    // Deactivate goal
    await this.prisma.nutritionGoal.update({
      where: { id },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });
  }

  /**
   * Format goal entity to response DTO
   */
  private formatGoalResponse(goal: any): GoalResponseDto {
    return {
      id: goal.id,
      userId: goal.userId,
      caloriesTarget: goal.caloriesTarget ?? null,
      proteinTarget: goal.proteinTarget ?? null,
      carbsTarget: goal.carbsTarget ?? null,
      fatTarget: goal.fatTarget ?? null,
      fiberTarget: goal.fiberTarget ?? null,
      sugarTarget: goal.sugarTarget ?? null,
      sodiumTarget: goal.sodiumTarget ?? null,
      startDate: goal.startDate.toISOString(),
      endDate: goal.endDate ? goal.endDate.toISOString() : null,
      isActive: goal.isActive,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    };
  }
}
