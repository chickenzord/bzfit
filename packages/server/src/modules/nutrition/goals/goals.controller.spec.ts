import { Test, TestingModule } from '@nestjs/testing';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../../auth/guards';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GoalResponseDto } from '@bzfit/shared';

describe('GoalsController', () => {
  let controller: GoalsController;
  let service: GoalsService;

  const mockGoal: GoalResponseDto = {
    id: 'goal-1',
    userId: 'user-1',
    caloriesTarget: 2000,
    proteinTarget: 150,
    carbsTarget: 200,
    fatTarget: 70,
    fiberTarget: null,
    sugarTarget: null,
    sodiumTarget: null,
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: null,
    isLatest: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockGoalsService = {
    getActive: jest.fn(),
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user-1', email: 'test@example.com' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalsController],
      providers: [
        {
          provide: GoalsService,
          useValue: mockGoalsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<GoalsController>(GoalsController);
    service = module.get<GoalsService>(GoalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getActive', () => {
    it('should return active goal when no date provided', async () => {
      mockGoalsService.getActive.mockResolvedValue(mockGoal);

      const result = await controller.getActive(mockRequest, undefined);

      expect(result).toEqual(mockGoal);
      expect(service.getActive).toHaveBeenCalledWith('user-1', undefined);
    });

    it('should return active goal for a specific date', async () => {
      mockGoalsService.getActive.mockResolvedValue(mockGoal);

      const result = await controller.getActive(mockRequest, '2024-06-15');

      expect(result).toEqual(mockGoal);
      expect(service.getActive).toHaveBeenCalledWith('user-1', '2024-06-15');
    });

    it('should return null when no goal is active on the given date', async () => {
      mockGoalsService.getActive.mockResolvedValue(null);

      const result = await controller.getActive(mockRequest, '2020-01-01');

      expect(result).toBeNull();
      expect(service.getActive).toHaveBeenCalledWith('user-1', '2020-01-01');
    });

    it('should use user ID from authenticated request', async () => {
      mockGoalsService.getActive.mockResolvedValue(mockGoal);

      await controller.getActive(mockRequest, undefined);

      expect(service.getActive).toHaveBeenCalledWith(mockRequest.user.id, undefined);
    });
  });

  describe('getAll', () => {
    it('should return all goals ordered by startDate descending', async () => {
      const pastGoal: GoalResponseDto = {
        ...mockGoal,
        id: 'goal-0',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2024-01-01T00:00:00.000Z',
        isLatest: false,
      };
      mockGoalsService.getAll.mockResolvedValue([mockGoal, pastGoal]);

      const result = await controller.getAll(mockRequest);

      expect(result).toHaveLength(2);
      expect(result[0].isLatest).toBe(true);
      expect(result[1].isLatest).toBe(false);
      expect(service.getAll).toHaveBeenCalledWith('user-1');
    });

    it('should return empty array when no goals exist', async () => {
      mockGoalsService.getAll.mockResolvedValue([]);

      const result = await controller.getAll(mockRequest);

      expect(result).toEqual([]);
    });

    it('should use user ID from authenticated request', async () => {
      mockGoalsService.getAll.mockResolvedValue([]);

      await controller.getAll(mockRequest);

      expect(service.getAll).toHaveBeenCalledWith(mockRequest.user.id);
    });
  });

  describe('create', () => {
    const createDto = {
      caloriesTarget: 2000,
      proteinTarget: 150,
      carbsTarget: 200,
      fatTarget: 70,
    };

    it('should create a new goal', async () => {
      mockGoalsService.create.mockResolvedValue(mockGoal);

      const result = await controller.create(mockRequest, createDto as any);

      expect(result).toEqual(mockGoal);
      expect(service.create).toHaveBeenCalledWith('user-1', createDto);
    });

    it('should create a goal with an explicit startDate', async () => {
      const dtoWithDate = { ...createDto, startDate: '2024-06-01' };
      mockGoalsService.create.mockResolvedValue({ ...mockGoal, startDate: '2024-06-01T00:00:00.000Z' });

      const result = await controller.create(mockRequest, dtoWithDate as any);

      expect(service.create).toHaveBeenCalledWith('user-1', dtoWithDate);
      expect(result.startDate).toBe('2024-06-01T00:00:00.000Z');
    });

    it('should throw BadRequestException when no targets are set', async () => {
      mockGoalsService.create.mockRejectedValue(
        new BadRequestException('At least one nutrition target must be set'),
      );

      await expect(controller.create(mockRequest, {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when startDate already exists for user', async () => {
      mockGoalsService.create.mockRejectedValue(
        new ConflictException('A goal with start date 2024-01-01 already exists'),
      );

      await expect(controller.create(mockRequest, createDto as any)).rejects.toThrow(ConflictException);
    });

    it('should use user ID from authenticated request', async () => {
      mockGoalsService.create.mockResolvedValue(mockGoal);

      await controller.create(mockRequest, createDto as any);

      expect(service.create).toHaveBeenCalledWith(mockRequest.user.id, createDto);
    });
  });

  describe('update', () => {
    const updateDto = { caloriesTarget: 1800 };

    it('should update goal targets', async () => {
      const updated = { ...mockGoal, caloriesTarget: 1800 };
      mockGoalsService.update.mockResolvedValue(updated);

      const result = await controller.update(mockRequest, 'goal-1', updateDto as any);

      expect(result.caloriesTarget).toBe(1800);
      expect(service.update).toHaveBeenCalledWith('user-1', 'goal-1', updateDto);
    });

    it('should throw NotFoundException when goal does not exist', async () => {
      mockGoalsService.update.mockRejectedValue(
        new NotFoundException('Goal with ID invalid-id not found'),
      );

      await expect(controller.update(mockRequest, 'invalid-id', updateDto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use user ID from authenticated request', async () => {
      mockGoalsService.update.mockResolvedValue(mockGoal);

      await controller.update(mockRequest, 'goal-1', updateDto as any);

      expect(service.update).toHaveBeenCalledWith(mockRequest.user.id, 'goal-1', updateDto);
    });
  });

  describe('delete', () => {
    it('should delete the latest goal', async () => {
      mockGoalsService.delete.mockResolvedValue(undefined);

      await controller.delete(mockRequest, 'goal-1');

      expect(service.delete).toHaveBeenCalledWith('user-1', 'goal-1');
    });

    it('should throw NotFoundException when goal does not exist', async () => {
      mockGoalsService.delete.mockRejectedValue(
        new NotFoundException('Goal with ID invalid-id not found'),
      );

      await expect(controller.delete(mockRequest, 'invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when trying to delete a past goal', async () => {
      mockGoalsService.delete.mockRejectedValue(
        new ForbiddenException('Only the latest goal can be deleted'),
      );

      await expect(controller.delete(mockRequest, 'goal-0')).rejects.toThrow(ForbiddenException);
    });

    it('should use user ID from authenticated request', async () => {
      mockGoalsService.delete.mockResolvedValue(undefined);

      await controller.delete(mockRequest, 'goal-1');

      expect(service.delete).toHaveBeenCalledWith(mockRequest.user.id, 'goal-1');
    });
  });

  describe('Authentication', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', GoalsController);
      const guardNames = guards.map((guard: any) => guard.name);

      expect(guardNames).toContain('JwtAuthGuard');
    });
  });
});
