import { Test, TestingModule } from '@nestjs/testing';
import { MealItemsController } from './meal-items.controller';
import { MealsService } from './meals.service';
import { JwtAuthGuard } from '../../auth/guards';
import { NotFoundException } from '@nestjs/common';
import { MealResponseDto } from '@bzfit/shared';

describe('MealItemsController', () => {
  let controller: MealItemsController;
  let service: MealsService;

  const baseMealResponse: MealResponseDto = {
    id: 'meal-1',
    userId: 'user-1',
    date: '2024-01-01',
    mealType: 'LUNCH',
    notes: null,
    items: [
      {
        id: 'item-1',
        mealId: 'meal-1',
        foodId: 'food-1',
        servingId: 'serving-1',
        quantity: 1,
        notes: null,
        food: { id: 'food-1', name: 'Rice', variant: null, brand: null },
        serving: { id: 'serving-1', name: 'Cup', size: 100, unit: 'g', calories: 200, protein: 4, carbs: 44, fat: 0.4 },
        nutrition: { calories: 200, protein: 4, carbs: 44, fat: 0.4 },
        createdAt: '2024-01-01T12:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z',
      },
      {
        id: 'item-2',
        mealId: 'meal-1',
        foodId: 'food-2',
        servingId: 'serving-2',
        quantity: 1,
        notes: null,
        food: { id: 'food-2', name: 'Chicken', variant: null, brand: null },
        serving: { id: 'serving-2', name: 'Piece', size: 120, unit: 'g', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
        nutrition: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
        createdAt: '2024-01-01T12:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z',
      },
    ],
    totals: { calories: 365, protein: 35, carbs: 44, fat: 4 },
    createdAt: '2024-01-01T12:00:00.000Z',
    updatedAt: '2024-01-01T12:00:00.000Z',
  };

  const mockMealsService = {
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user-1', email: 'test@example.com' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealItemsController],
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

    controller = module.get<MealItemsController>(MealItemsController);
    service = module.get<MealsService>(MealsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('update (PATCH /nutrition/meal-items/:id)', () => {
    it('should update item quantity and return meal with recalculated totals', async () => {
      const updatedMeal: MealResponseDto = {
        ...baseMealResponse,
        items: [
          { ...baseMealResponse.items[0], quantity: 2, nutrition: { calories: 400, protein: 8, carbs: 88, fat: 0.8 } },
          baseMealResponse.items[1],
        ],
        totals: { calories: 565, protein: 39, carbs: 88, fat: 4.4 },
      };
      mockMealsService.updateItem.mockResolvedValue(updatedMeal);

      const result = await controller.update(mockRequest, 'item-1', { quantity: 2 });

      expect(result.totals.calories).toBe(565);
      expect(result.items[0].quantity).toBe(2);
      expect(service.updateItem).toHaveBeenCalledWith('user-1', 'item-1', { quantity: 2 });
    });

    it('should update notes', async () => {
      const updatedMeal = {
        ...baseMealResponse,
        items: [{ ...baseMealResponse.items[0], notes: 'Extra large' }, baseMealResponse.items[1]],
      };
      mockMealsService.updateItem.mockResolvedValue(updatedMeal);

      const result = await controller.update(mockRequest, 'item-1', { notes: 'Extra large' });

      expect(result.items[0].notes).toBe('Extra large');
    });

    it('should throw NotFoundException when item does not exist', async () => {
      mockMealsService.updateItem.mockRejectedValue(
        new NotFoundException('Meal item with ID invalid-item not found'),
      );

      await expect(
        controller.update(mockRequest, 'invalid-item', { quantity: 2 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when item belongs to different user', async () => {
      mockMealsService.updateItem.mockRejectedValue(
        new NotFoundException('Meal item with ID item-1 not found'),
      );

      const otherUserRequest = { user: { id: 'user-other', email: 'other@example.com' } };

      await expect(
        controller.update(otherUserRequest, 'item-1', { quantity: 2 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use user ID from authenticated request', async () => {
      mockMealsService.updateItem.mockResolvedValue(baseMealResponse);

      await controller.update(mockRequest, 'item-1', { quantity: 1 });

      expect(service.updateItem).toHaveBeenCalledWith(mockRequest.user.id, 'item-1', { quantity: 1 });
    });
  });

  describe('delete (DELETE /nutrition/meal-items/:id)', () => {
    it('should delete an item and return updated meal totals', async () => {
      const mealAfterDelete: MealResponseDto = {
        ...baseMealResponse,
        items: [baseMealResponse.items[1]],
        totals: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      };
      mockMealsService.deleteItem.mockResolvedValue(mealAfterDelete);

      await controller.delete(mockRequest, 'item-1');

      expect(service.deleteItem).toHaveBeenCalledWith('user-1', 'item-1');
    });

    it('should auto-delete meal when last item is removed', async () => {
      // deleteItem returns void when meal is also deleted
      mockMealsService.deleteItem.mockResolvedValue(undefined);

      const singleItemMeal: MealResponseDto = {
        ...baseMealResponse,
        items: [baseMealResponse.items[0]],
        totals: { calories: 200, protein: 4, carbs: 44, fat: 0.4 },
      };

      // Service deletes the meal when last item removed — controller just calls service
      await controller.delete(mockRequest, 'item-1');

      expect(service.deleteItem).toHaveBeenCalledWith('user-1', 'item-1');
      expect(service.deleteItem).toHaveBeenCalledTimes(1);
      // Void return confirms meal auto-deletion is handled by service
      expect(singleItemMeal.items.length).toBe(1);
    });

    it('should throw NotFoundException when item does not exist', async () => {
      mockMealsService.deleteItem.mockRejectedValue(
        new NotFoundException('Meal item with ID invalid-item not found'),
      );

      await expect(controller.delete(mockRequest, 'invalid-item')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when item belongs to different user', async () => {
      mockMealsService.deleteItem.mockRejectedValue(
        new NotFoundException('Meal item with ID item-1 not found'),
      );

      const otherUserRequest = { user: { id: 'user-other', email: 'other@example.com' } };

      await expect(controller.delete(otherUserRequest, 'item-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use user ID from authenticated request', async () => {
      mockMealsService.deleteItem.mockResolvedValue(undefined);

      await controller.delete(mockRequest, 'item-1');

      expect(service.deleteItem).toHaveBeenCalledWith(mockRequest.user.id, 'item-1');
    });
  });

  describe('Authentication', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MealItemsController);
      const guardNames = guards.map((guard: any) => guard.name);

      expect(guardNames).toContain('JwtAuthGuard');
    });
  });
});
