import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('GoalsService', () => {
  let service: GoalsService;
  let _prisma: PrismaService;

  const START_JAN = new Date('2024-01-01T00:00:00.000Z');
  const START_JUN = new Date('2024-06-01T00:00:00.000Z');

  const mockGoalJan = {
    id: 'goal-1',
    userId: 'user-1',
    caloriesTarget: 2000,
    proteinTarget: 150,
    carbsTarget: 200,
    fatTarget: 70,
    fiberTarget: null,
    sugarTarget: null,
    sodiumTarget: null,
    startDate: START_JAN,
    endDate: null,
    createdAt: START_JAN,
    updatedAt: START_JAN,
  };

  const mockGoalJun = {
    id: 'goal-2',
    userId: 'user-1',
    caloriesTarget: 1800,
    proteinTarget: 140,
    carbsTarget: 180,
    fatTarget: 60,
    fiberTarget: null,
    sugarTarget: null,
    sodiumTarget: null,
    startDate: START_JUN,
    endDate: null,
    createdAt: START_JUN,
    updatedAt: START_JUN,
  };

  const mockPrisma = {
    nutritionGoal: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
    _prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getActive ────────────────────────────────────────────────────────────

  describe('getActive', () => {
    it('should return null when no goal is active on the target date', async () => {
      mockPrisma.nutritionGoal.findFirst
        .mockResolvedValueOnce(null); // active goal query

      const result = await service.getActive('user-1', '2023-12-31');

      expect(result).toBeNull();
    });

    it('should return the active goal for a specific date', async () => {
      mockPrisma.nutritionGoal.findFirst
        .mockResolvedValueOnce(mockGoalJan)   // active goal query
        .mockResolvedValueOnce(mockGoalJan);  // getLatestGoal query

      const result = await service.getActive('user-1', '2024-03-15');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('goal-1');
      expect(result!.isLatest).toBe(true);
    });

    it('should mark isLatest=false when a newer goal exists', async () => {
      const closedJan = { ...mockGoalJan, endDate: START_JUN };
      mockPrisma.nutritionGoal.findFirst
        .mockResolvedValueOnce(closedJan)   // active goal for that date
        .mockResolvedValueOnce(mockGoalJun); // getLatestGoal → newer goal

      const result = await service.getActive('user-1', '2024-03-15');

      expect(result!.id).toBe('goal-1');
      expect(result!.isLatest).toBe(false);
    });


    it('should default to today when no date is provided', async () => {
      mockPrisma.nutritionGoal.findFirst
        .mockResolvedValueOnce(mockGoalJan)
        .mockResolvedValueOnce(mockGoalJan);

      const result = await service.getActive('user-1');

      expect(result).not.toBeNull();
      // Verify findFirst was called with lte: a Date (today)
      const callArg = (mockPrisma.nutritionGoal.findFirst as jest.Mock).mock.calls[0][0];
      expect(callArg.where.startDate.lte).toBeInstanceOf(Date);
    });
  });

  // ─── getAll ───────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('should return empty array when user has no goals', async () => {
      mockPrisma.nutritionGoal.findMany.mockResolvedValue([]);

      const result = await service.getAll('user-1');

      expect(result).toEqual([]);
    });

    it('should return all goals with isLatest=true only for the first (newest)', async () => {
      const closedJan = { ...mockGoalJan, endDate: START_JUN };
      mockPrisma.nutritionGoal.findMany.mockResolvedValue([mockGoalJun, closedJan]);

      const result = await service.getAll('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('goal-2');
      expect(result[0].isLatest).toBe(true);
      expect(result[1].id).toBe('goal-1');
      expect(result[1].isLatest).toBe(false);
    });

    it('should return single goal with isLatest=true', async () => {
      mockPrisma.nutritionGoal.findMany.mockResolvedValue([mockGoalJan]);

      const result = await service.getAll('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].isLatest).toBe(true);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const validDto = {
      caloriesTarget: 2000,
      proteinTarget: 150,
      carbsTarget: 200,
      fatTarget: 70,
    };

    it('should throw BadRequestException when no targets are set', async () => {
      await expect(service.create('user-1', {})).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when startDate already exists for user', async () => {
      mockPrisma.nutritionGoal.findUnique.mockResolvedValue(mockGoalJan);

      await expect(
        service.create('user-1', { ...validDto, startDate: '2024-01-01' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create goal without closing previous when none is open', async () => {
      mockPrisma.nutritionGoal.findUnique.mockResolvedValue(null);
      mockPrisma.nutritionGoal.findFirst.mockResolvedValue(null); // no open goal
      mockPrisma.nutritionGoal.create.mockResolvedValue(mockGoalJun);

      const result = await service.create('user-1', { ...validDto, startDate: '2024-06-01' });

      expect(mockPrisma.nutritionGoal.update).not.toHaveBeenCalled();
      expect(result.id).toBe('goal-2');
      expect(result.isLatest).toBe(true);
    });

    it('should close the current open goal before creating a new one', async () => {
      mockPrisma.nutritionGoal.findUnique.mockResolvedValue(null);
      mockPrisma.nutritionGoal.findFirst.mockResolvedValue(mockGoalJan); // open goal exists
      mockPrisma.nutritionGoal.update.mockResolvedValue({ ...mockGoalJan, endDate: START_JUN });
      mockPrisma.nutritionGoal.create.mockResolvedValue(mockGoalJun);

      await service.create('user-1', { ...validDto, startDate: '2024-06-01' });

      expect(mockPrisma.nutritionGoal.update).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: { endDate: START_JUN },
      });
    });

    it('should default startDate to today when not provided', async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      mockPrisma.nutritionGoal.findUnique.mockResolvedValue(null);
      mockPrisma.nutritionGoal.findFirst.mockResolvedValue(null);
      mockPrisma.nutritionGoal.create.mockResolvedValue({ ...mockGoalJan, startDate: today });

      await service.create('user-1', validDto);

      const createCall = (mockPrisma.nutritionGoal.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.startDate).toBeInstanceOf(Date);
      expect(createCall.data.startDate.toISOString().slice(0, 10)).toBe(
        today.toISOString().slice(0, 10),
      );
    });

    it('should normalize startDate to midnight UTC', async () => {
      mockPrisma.nutritionGoal.findUnique.mockResolvedValue(null);
      mockPrisma.nutritionGoal.findFirst.mockResolvedValue(null);
      mockPrisma.nutritionGoal.create.mockResolvedValue(mockGoalJun);

      await service.create('user-1', { ...validDto, startDate: '2024-06-01' });

      const createCall = (mockPrisma.nutritionGoal.create as jest.Mock).mock.calls[0][0];
      const savedDate: Date = createCall.data.startDate;
      expect(savedDate.getUTCHours()).toBe(0);
      expect(savedDate.getUTCMinutes()).toBe(0);
      expect(savedDate.getUTCSeconds()).toBe(0);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NotFoundException when goal does not exist', async () => {
      mockPrisma.nutritionGoal.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'non-existent', { caloriesTarget: 1800 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update goal targets and return updated goal', async () => {
      const updatedGoal = { ...mockGoalJan, caloriesTarget: 1800 };
      mockPrisma.nutritionGoal.findFirst
        .mockResolvedValueOnce(mockGoalJan)  // ownership check
        .mockResolvedValueOnce(mockGoalJan); // getLatestGoal
      mockPrisma.nutritionGoal.update.mockResolvedValue(updatedGoal);

      const result = await service.update('user-1', 'goal-1', { caloriesTarget: 1800 });

      expect(result.caloriesTarget).toBe(1800);
      expect(mockPrisma.nutritionGoal.update).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: { caloriesTarget: 1800 },
      });
    });

    it('should set isLatest=true when updating the latest goal', async () => {
      mockPrisma.nutritionGoal.findFirst
        .mockResolvedValueOnce(mockGoalJun)  // ownership check
        .mockResolvedValueOnce(mockGoalJun); // getLatestGoal
      mockPrisma.nutritionGoal.update.mockResolvedValue({ ...mockGoalJun, caloriesTarget: 1600 });

      const result = await service.update('user-1', 'goal-2', { caloriesTarget: 1600 });

      expect(result.isLatest).toBe(true);
    });

    it('should set isLatest=false when updating a past goal', async () => {
      const closedJan = { ...mockGoalJan, endDate: START_JUN };
      mockPrisma.nutritionGoal.findFirst
        .mockResolvedValueOnce(closedJan)    // ownership check
        .mockResolvedValueOnce(mockGoalJun); // getLatestGoal → newer goal
      mockPrisma.nutritionGoal.update.mockResolvedValue({ ...closedJan, caloriesTarget: 1900 });

      const result = await service.update('user-1', 'goal-1', { caloriesTarget: 1900 });

      expect(result.isLatest).toBe(false);
    });

    it('should not allow updating goal of another user', async () => {
      mockPrisma.nutritionGoal.findFirst.mockResolvedValue(null); // userId mismatch → not found

      await expect(
        service.update('user-2', 'goal-1', { caloriesTarget: 1800 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should throw NotFoundException when goal does not exist', async () => {
      mockPrisma.nutritionGoal.findFirst.mockResolvedValue(null);

      await expect(service.delete('user-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when trying to delete a past goal', async () => {
      const closedJan = { ...mockGoalJan, endDate: START_JUN };
      mockPrisma.nutritionGoal.findFirst
        .mockResolvedValueOnce(closedJan)    // ownership check
        .mockResolvedValueOnce(mockGoalJun); // getLatestGoal → newer goal

      await expect(service.delete('user-1', 'goal-1')).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.nutritionGoal.delete).not.toHaveBeenCalled();
    });

    it('should delete the latest goal', async () => {
      mockPrisma.nutritionGoal.findFirst
        .mockResolvedValueOnce(mockGoalJan)  // ownership check
        .mockResolvedValueOnce(mockGoalJan); // getLatestGoal
      mockPrisma.nutritionGoal.delete.mockResolvedValue(mockGoalJan);

      await service.delete('user-1', 'goal-1');

      expect(mockPrisma.nutritionGoal.delete).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
    });

    it('should not allow deleting goal of another user', async () => {
      mockPrisma.nutritionGoal.findFirst.mockResolvedValue(null); // userId mismatch → not found

      await expect(service.delete('user-2', 'goal-1')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.nutritionGoal.delete).not.toHaveBeenCalled();
    });
  });
});
