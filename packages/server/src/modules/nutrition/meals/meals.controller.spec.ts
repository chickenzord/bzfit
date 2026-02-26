import { Test, TestingModule } from '@nestjs/testing';
import { MealsController } from './meals.controller';
import { MealsService } from './meals.service';
import { JwtAuthGuard } from '../../auth/guards';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MealResponseDto } from '@bzfit/shared';

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
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addItem: jest.fn(),
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
      expect(service.findAll).toHaveBeenCalledWith('user-1', undefined, undefined, undefined, undefined);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should filter meals by date', async () => {
      mockMealsService.findAll.mockResolvedValue([mockMealResponse]);

      const result = await controller.findAll(mockRequest, '2024-01-01');

      expect(result).toEqual([mockMealResponse]);
      expect(service.findAll).toHaveBeenCalledWith('user-1', '2024-01-01', undefined, undefined, undefined);
    });

    it('should filter meals by meal type', async () => {
      mockMealsService.findAll.mockResolvedValue([mockMealResponse]);

      const result = await controller.findAll(mockRequest, undefined, 'BREAKFAST');

      expect(result).toEqual([mockMealResponse]);
      expect(service.findAll).toHaveBeenCalledWith('user-1', undefined, 'BREAKFAST', undefined, undefined);
    });

    it('should filter meals by both date and meal type', async () => {
      mockMealsService.findAll.mockResolvedValue([mockMealResponse]);

      const result = await controller.findAll(mockRequest, '2024-01-01', 'BREAKFAST');

      expect(result).toEqual([mockMealResponse]);
      expect(service.findAll).toHaveBeenCalledWith('user-1', '2024-01-01', 'BREAKFAST', undefined, undefined);
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
        expect(service.findAll).toHaveBeenCalledWith('user-1', undefined, mealType, undefined, undefined);
      }
    });

    it('should use user ID from authenticated request', async () => {
      mockMealsService.findAll.mockResolvedValue([mockMealResponse]);

      await controller.findAll(mockRequest);

      expect(service.findAll).toHaveBeenCalledWith(mockRequest.user.id, undefined, undefined, undefined, undefined);
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

  describe('create', () => {
    const createDto = {
      date: '2024-01-01',
      mealType: 'LUNCH' as const,
      notes: "Today's lunch",
    };

    it('should create a meal without items', async () => {
      const created = { ...mockMealResponse, mealType: 'LUNCH', items: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
      mockMealsService.create.mockResolvedValue(created);

      const result = await controller.create(mockRequest, createDto as any);

      expect(result).toEqual(created);
      expect(service.create).toHaveBeenCalledWith('user-1', createDto);
    });

    it('should create a meal with initial items', async () => {
      const dtoWithItems = {
        ...createDto,
        items: [{ foodId: 'food-1', servingId: 'serving-1', quantity: 1 }],
      };
      mockMealsService.create.mockResolvedValue(mockMealResponse);

      const result = await controller.create(mockRequest, dtoWithItems as any);

      expect(result).toEqual(mockMealResponse);
      expect(service.create).toHaveBeenCalledWith('user-1', dtoWithItems);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should throw BadRequestException when duplicate meal exists for same date and mealType', async () => {
      mockMealsService.create.mockRejectedValue(
        new BadRequestException('Meal already exists for LUNCH on 2024-01-01.'),
      );

      await expect(controller.create(mockRequest, createDto as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.create).toHaveBeenCalledWith('user-1', createDto);
    });

    it('should use user ID from authenticated request', async () => {
      mockMealsService.create.mockResolvedValue(mockMealResponse);

      await controller.create(mockRequest, createDto as any);

      expect(service.create).toHaveBeenCalledWith(mockRequest.user.id, createDto);
    });
  });

  describe('update', () => {
    it('should update meal notes', async () => {
      const updated = { ...mockMealResponse, notes: 'Updated notes' };
      mockMealsService.update.mockResolvedValue(updated);

      const result = await controller.update(mockRequest, 'meal-1', 'Updated notes');

      expect(result.notes).toBe('Updated notes');
      expect(service.update).toHaveBeenCalledWith('user-1', 'meal-1', 'Updated notes');
    });

    it('should throw NotFoundException when meal does not exist', async () => {
      mockMealsService.update.mockRejectedValue(
        new NotFoundException('Meal with ID invalid-id not found'),
      );

      await expect(
        controller.update(mockRequest, 'invalid-id', 'notes'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use user ID from authenticated request', async () => {
      mockMealsService.update.mockResolvedValue(mockMealResponse);

      await controller.update(mockRequest, 'meal-1', 'notes');

      expect(service.update).toHaveBeenCalledWith(mockRequest.user.id, 'meal-1', 'notes');
    });
  });

  describe('delete', () => {
    it('should delete meal and cascade delete its items', async () => {
      mockMealsService.delete.mockResolvedValue(undefined);

      await controller.delete(mockRequest, 'meal-1');

      expect(service.delete).toHaveBeenCalledWith('user-1', 'meal-1');
      expect(service.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when meal does not exist', async () => {
      mockMealsService.delete.mockRejectedValue(
        new NotFoundException('Meal with ID invalid-id not found'),
      );

      await expect(controller.delete(mockRequest, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use user ID from authenticated request', async () => {
      mockMealsService.delete.mockResolvedValue(undefined);

      await controller.delete(mockRequest, 'meal-1');

      expect(service.delete).toHaveBeenCalledWith(mockRequest.user.id, 'meal-1');
    });
  });

  describe('addItem', () => {
    const addItemDto = {
      foodId: '11111111-1111-1111-1111-111111111111',
      servingId: '22222222-2222-2222-2222-222222222222',
      quantity: 1.5,
    };

    it('should add item to existing meal', async () => {
      const mealWithNewItem = {
        ...mockMealResponse,
        items: [...mockMealResponse.items, { ...mockMealResponse.items[0], id: 'item-2', quantity: 1.5 }],
      };
      mockMealsService.addItem.mockResolvedValue(mealWithNewItem);

      const result = await controller.addItem(mockRequest, 'meal-1', addItemDto as any);

      expect(result.items.length).toBe(2);
      expect(service.addItem).toHaveBeenCalledWith('user-1', 'meal-1', addItemDto);
    });

    it('should throw BadRequestException when foodId is invalid', async () => {
      mockMealsService.addItem.mockRejectedValue(
        new BadRequestException('Food with ID 11111111-1111-1111-1111-111111111111 not found'),
      );

      await expect(
        controller.addItem(mockRequest, 'meal-1', addItemDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when serving does not belong to food', async () => {
      mockMealsService.addItem.mockRejectedValue(
        new BadRequestException('Serving 22222222-2222-2222-2222-222222222222 does not belong to food 11111111-1111-1111-1111-111111111111'),
      );

      await expect(
        controller.addItem(mockRequest, 'meal-1', addItemDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when meal does not exist', async () => {
      mockMealsService.addItem.mockRejectedValue(
        new NotFoundException('Meal with ID invalid-meal not found'),
      );

      await expect(
        controller.addItem(mockRequest, 'invalid-meal', addItemDto as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use user ID from authenticated request', async () => {
      mockMealsService.addItem.mockResolvedValue(mockMealResponse);

      await controller.addItem(mockRequest, 'meal-1', addItemDto as any);

      expect(service.addItem).toHaveBeenCalledWith(mockRequest.user.id, 'meal-1', addItemDto);
    });
  });

  describe('Authentication', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MealsController);
      const guardNames = guards.map((guard: any) => guard.name);

      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should require authentication for all endpoints', () => {
      const controllerGuards = Reflect.getMetadata('__guards__', MealsController);
      expect(controllerGuards).toBeDefined();
    });
  });
});
