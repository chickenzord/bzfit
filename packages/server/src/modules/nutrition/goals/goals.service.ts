import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto, GoalResponseDto } from '@bzfit/shared';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get the active goal on a specific date.
   * If multiple match, returns the one with the newer startDate.
   */
  async getActive(userId: string, date?: string): Promise<GoalResponseDto | null> {
    const targetDate = date ? new Date(date) : new Date();

    const goal = await this.prisma.nutritionGoal.findFirst({
      where: {
        userId,
        startDate: { lte: targetDate },
        OR: [{ endDate: null }, { endDate: { gt: targetDate } }],
      },
      orderBy: { startDate: 'desc' },
    });

    if (!goal) return null;

    const latest = await this.getLatestGoal(userId);
    return this.formatGoalResponse(goal, latest?.id === goal.id);
  }

  /**
   * Get all goals for the user, ordered by startDate descending.
   */
  async getAll(userId: string): Promise<GoalResponseDto[]> {
    const goals = await this.prisma.nutritionGoal.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });

    const latestId = goals[0]?.id;
    return goals.map((goal) => this.formatGoalResponse(goal, goal.id === latestId));
  }

  /**
   * Create a new goal. Closes any currently open goal by setting its endDate
   * to the new goal's startDate.
   */
  async create(userId: string, createGoalDto: CreateGoalDto): Promise<GoalResponseDto> {
    this.validateTargets(createGoalDto);

    const startDate = createGoalDto.startDate ? new Date(createGoalDto.startDate) : new Date();
    // Normalize to start of day (UTC)
    startDate.setUTCHours(0, 0, 0, 0);

    // Check uniqueness of startDate per user
    const existing = await this.prisma.nutritionGoal.findUnique({
      where: { userId_startDate: { userId, startDate } },
    });
    if (existing) {
      throw new ConflictException(`A goal with start date ${startDate.toISOString().slice(0, 10)} already exists`);
    }

    // Close the currently open goal (endDate IS NULL and startDate <= new startDate)
    const openGoal = await this.prisma.nutritionGoal.findFirst({
      where: {
        userId,
        endDate: null,
        startDate: { lte: startDate },
      },
      orderBy: { startDate: 'desc' },
    });

    if (openGoal) {
      await this.prisma.nutritionGoal.update({
        where: { id: openGoal.id },
        data: { endDate: startDate },
      });
    }

    const { startDate: _startDate, ...targets } = createGoalDto;
    const goal = await this.prisma.nutritionGoal.create({
      data: {
        userId,
        startDate,
        ...targets,
      },
    });

    return this.formatGoalResponse(goal, true);
  }

  /**
   * Update a goal's targets.
   * - startDate is never updatable.
   * - endDate is only updatable for the latest goal (null endDate).
   */
  async update(userId: string, id: string, updateGoalDto: UpdateGoalDto): Promise<GoalResponseDto> {
    const goal = await this.prisma.nutritionGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    const updated = await this.prisma.nutritionGoal.update({
      where: { id },
      data: updateGoalDto,
    });

    const latest = await this.getLatestGoal(userId);
    return this.formatGoalResponse(updated, latest?.id === updated.id);
  }

  /**
   * Delete a goal. If it's not the latest goal, the operation is forbidden
   * because deleting past goals would corrupt the date-range history.
   */
  async delete(userId: string, id: string): Promise<void> {
    const goal = await this.prisma.nutritionGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    const latest = await this.getLatestGoal(userId);
    if (latest?.id !== goal.id) {
      throw new ForbiddenException('Only the latest goal can be deleted');
    }

    await this.prisma.nutritionGoal.delete({ where: { id } });
  }

  private async getLatestGoal(userId: string) {
    return this.prisma.nutritionGoal.findFirst({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  private validateTargets(dto: Partial<CreateGoalDto>) {
    const hasTarget =
      dto.caloriesTarget != null ||
      dto.proteinTarget != null ||
      dto.carbsTarget != null ||
      dto.fatTarget != null ||
      dto.fiberTarget != null ||
      dto.sugarTarget != null ||
      dto.sodiumTarget != null;

    if (!hasTarget) {
      throw new BadRequestException('At least one nutrition target must be set');
    }
  }

  private formatGoalResponse(goal: any, isLatest: boolean): GoalResponseDto {
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
      isLatest,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    };
  }
}
