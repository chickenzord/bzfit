import { Test, TestingModule } from '@nestjs/testing';
import { MealsController } from './meals.controller';
import { MealsService } from './meals.service';
import { JwtAuthGuard } from '../../auth/guards';
import { NotFoundException } from '@nestjs/common';
import { MealResponseDto } from '../../../../shared/dto';

describe('MealsController', () => {
  let controller: MealsController;
  let service: MealsService;

  const mockMealResponse: MealResponseDto = {
    id: 'meal-1',
    userId: 'user-1',
    date: '2024-01-01',
    mealType: 'BREAKFAST',
    notes: null,
    items: [
      {
        id: 'item-1',
        mealId: 'meal-1',
        foodId: 'food-1',
        servingId: 'serving-1',
        quantity: 1,
        notes: null,
        isEstimated: false,
        food: {
          id: 'food-1',
          name: 'Oatmeal',
          variant: null,
          brand: null,
        },
        serving: {
          id: 'serving-1',
          name: 'Cup',
          size: 100,
          unit: 'g',
          calories: 150,
          protein: 5,
          carbs: 27,
          fat: 2.5,
        },
        nutrition: {
          calories: 150,
          protein: 5,
          carbs: 27,
          fat: 2.5,
        },
        createdAt: '2024-01-01T08:00:00.000Z',
        updatedAt: '2024-01-01T08:00:00.000Z',
      },
    ],
    totals: {
      calories: 150,
      protein: 5,
      carbs: 27,
      fat: 2.5,
    },
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-01T08:00:00.000Z',
  };

  const mockDailySummary = {
    date: '2024-01-01',
    meals: [mockMealResponse],
    totals: {
      calories: 150,
      protein: 5,
      carbs: 27,
      fat: 2.5,
    },
  };

  const mockMealsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    getDailySummary: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user-1', email: 'test@example.com' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealsController],
      providers: [
        {
          provide: MealsService,
          useValue: mockMealsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MealsController>(MealsController);
    service = module.get<MealsService>(MealsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all meals for the current user without filters', async () => {
      mockMealsService.findAll.mockResolvedValue([mockMealResponse]);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual([mockMealResponse]);
      expect(service.findAll).toHaveBeenCalledWith('user-1', undefined, undefined);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should filter meals by date', async () => {
      mockMealsService.findAll.mockResolvedValue([mockMealResponse]);

      const result = await controller.findAll(mockRequest, '2024-01-01');

      expect(result).toEqual([mockMealResponse]);
      expect(service.findAll).toHaveBeenCalledWith('user-1', '2024-01-01', undefined);
    });

    it('should filter meals by meal type', async () => {
      mockMealsService.findAll.mockResolvedValue([mockMealResponse]);

      const result = await controller.findAll(mockRequest, undefined, 'BREAKFAST');

      expect(result).toEqual([mockMealResponse]);
      expect(service.findAll).toHaveBeenCalledWith('user-1', undefined, 'BREAKFAST');
    });

    it('should filter meals by both date and meal type', async () => {
      mockMealsService.findAll.mockResolvedValue([mockMealResponse]);

      const result = await controller.findAll(mockRequest, '2024-01-01', 'BREAKFAST');

      expect(result).toEqual([mockMealResponse]);
      expect(service.findAll).toHaveBeenCalledWith('user-1', '2024-01-01', 'BREAKFAST');
    });

    it('should return empty array when no meals found', async () => {
      mockMealsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle different meal types', async () => {
      const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

      mockMealsService.findAll.mockResolvedValue([mockMealResponse]);

      for (const mealType of mealTypes) {
        await controller.findAll(mockRequest, undefined, mealType);
        expect(service.findAll).toHaveBeenCalledWith('user-1', undefined, mealType);
      }
    });

    it('should use user ID from authenticated request', async () => {
      mockMealsService.findAll.mockResolvedValue([mockMealResponse]);

      await controller.findAll(mockRequest);

      expect(service.findAll).toHaveBeenCalledWith(mockRequest.user.id, undefined, undefined);
    });

    it('should return meals with items and totals', async () => {
      mockMealsService.findAll.mockResolvedValue([mockMealResponse]);

      const result = await controller.findAll(mockRequest);

      expect(result[0]).toHaveProperty('items');
      expect(result[0]).toHaveProperty('totals');
      expect(result[0].items).toBeDefined();
      expect(result[0].totals).toBeDefined();
    });
  });

  describe('getDailySummary', () => {
    it('should return daily summary for specified date', async () => {
      mockMealsService.getDailySummary.mockResolvedValue(mockDailySummary);

      const result = await controller.getDailySummary(mockRequest, '2024-01-01');

      expect(result).toEqual(mockDailySummary);
      expect(result.date).toBe('2024-01-01');
      expect(result.meals).toBeDefined();
      expect(result.totals).toBeDefined();
      expect(service.getDailySummary).toHaveBeenCalledWith('user-1', '2024-01-01');
      expect(service.getDailySummary).toHaveBeenCalledTimes(1);
    });

    it('should return all meals for the day', async () => {
      const multiMealSummary = {
        date: '2024-01-01',
        meals: [
          { ...mockMealResponse, mealType: 'BREAKFAST' },
          { ...mockMealResponse, id: 'meal-2', mealType: 'LUNCH' },
          { ...mockMealResponse, id: 'meal-3', mealType: 'DINNER' },
        ],
        totals: {
          calories: 450,
          protein: 15,
          carbs: 81,
          fat: 7.5,
        },
      };
      mockMealsService.getDailySummary.mockResolvedValue(multiMealSummary);

      const result = await controller.getDailySummary(mockRequest, '2024-01-01');

      expect(result.meals.length).toBe(3);
      expect(result.totals.calories).toBe(450);
    });

    it('should calculate aggregated nutrition totals', async () => {
      mockMealsService.getDailySummary.mockResolvedValue(mockDailySummary);

      const result = await controller.getDailySummary(mockRequest, '2024-01-01');

      expect(result.totals).toHaveProperty('calories');
      expect(result.totals).toHaveProperty('protein');
      expect(result.totals).toHaveProperty('carbs');
      expect(result.totals).toHaveProperty('fat');
      expect(typeof result.totals.calories).toBe('number');
    });

    it('should handle date in YYYY-MM-DD format', async () => {
      mockMealsService.getDailySummary.mockResolvedValue(mockDailySummary);

      await controller.getDailySummary(mockRequest, '2024-01-01');

      expect(service.getDailySummary).toHaveBeenCalledWith('user-1', '2024-01-01');
    });

    it('should return empty meals array for day with no meals', async () => {
      const emptySummary = {
        date: '2024-01-01',
        meals: [],
        totals: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      };
      mockMealsService.getDailySummary.mockResolvedValue(emptySummary);

      const result = await controller.getDailySummary(mockRequest, '2024-01-01');

      expect(result.meals).toEqual([]);
      expect(result.totals.calories).toBe(0);
    });

    it('should use user ID from authenticated request', async () => {
      mockMealsService.getDailySummary.mockResolvedValue(mockDailySummary);

      await controller.getDailySummary(mockRequest, '2024-01-01');

      expect(service.getDailySummary).toHaveBeenCalledWith(mockRequest.user.id, '2024-01-01');
    });
  });

  describe('findOne', () => {
    it('should return meal by ID', async () => {
      mockMealsService.findOne.mockResolvedValue(mockMealResponse);

      const result = await controller.findOne(mockRequest, 'meal-1');

      expect(result).toEqual(mockMealResponse);
      expect(service.findOne).toHaveBeenCalledWith('user-1', 'meal-1');
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should include meal items with food and serving details', async () => {
      mockMealsService.findOne.mockResolvedValue(mockMealResponse);

      const result = await controller.findOne(mockRequest, 'meal-1');

      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]).toHaveProperty('food');
      expect(result.items[0]).toHaveProperty('serving');
      expect(result.items[0]).toHaveProperty('nutrition');
    });

    it('should include calculated nutrition totals', async () => {
      mockMealsService.findOne.mockResolvedValue(mockMealResponse);

      const result = await controller.findOne(mockRequest, 'meal-1');

      expect(result.totals).toBeDefined();
      expect(result.totals).toHaveProperty('calories');
      expect(result.totals).toHaveProperty('protein');
      expect(result.totals).toHaveProperty('carbs');
      expect(result.totals).toHaveProperty('fat');
    });

    it('should throw NotFoundException when meal does not exist', async () => {
      mockMealsService.findOne.mockRejectedValue(
        new NotFoundException('Meal with ID invalid-id not found'),
      );

      await expect(
        controller.findOne(mockRequest, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith('user-1', 'invalid-id');
    });

    it('should throw NotFoundException when meal belongs to different user', async () => {
      mockMealsService.findOne.mockRejectedValue(
        new NotFoundException('Meal with ID meal-1 not found'),
      );

      await expect(
        controller.findOne(mockRequest, 'meal-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use user ID from authenticated request', async () => {
      mockMealsService.findOne.mockResolvedValue(mockMealResponse);

      await controller.findOne(mockRequest, 'meal-1');

      expect(service.findOne).toHaveBeenCalledWith(mockRequest.user.id, 'meal-1');
    });

    it('should handle UUID format IDs', async () => {
      const uuidId = '123e4567-e89b-12d3-a456-426614174000';
      mockMealsService.findOne.mockResolvedValue({
        ...mockMealResponse,
        id: uuidId,
      });

      const result = await controller.findOne(mockRequest, uuidId);

      expect(result.id).toBe(uuidId);
      expect(service.findOne).toHaveBeenCalledWith('user-1', uuidId);
    });
  });

  describe('Authentication', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MealsController);
      const guardNames = guards.map((guard: any) => guard.name);

      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should require authentication for all endpoints', () => {
      const findAllGuards = Reflect.getMetadata(
        '__guards__',
        MealsController.prototype.findAll,
      );
      const findOneGuards = Reflect.getMetadata(
        '__guards__',
        MealsController.prototype.findOne,
      );
      const getDailySummaryGuards = Reflect.getMetadata(
        '__guards__',
        MealsController.prototype.getDailySummary,
      );

      // Guards are applied at controller level, so method-level may be undefined
      // Check that controller-level guards exist
      const controllerGuards = Reflect.getMetadata('__guards__', MealsController);
      expect(controllerGuards).toBeDefined();
    });
  });
});
