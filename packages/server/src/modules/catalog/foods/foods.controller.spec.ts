import { Test, TestingModule } from '@nestjs/testing';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { JwtAuthGuard } from '../../auth/guards';
import { NotFoundException } from '@nestjs/common';
import { FoodResponseDto, CreateFoodDto, UpdateFoodDto } from '@bzfit/shared';
import { ServingStatus } from '@prisma/client';

describe('FoodsController', () => {
  let controller: FoodsController;
  let service: FoodsService;

  const mockFoodResponse: FoodResponseDto = {
    id: 'food-1',
    name: 'White Rice',
    variant: 'Jasmine',
    brand: 'Uncle Bens',
    servings: [
      {
        id: 'serving-1',
        foodId: 'food-1',
        name: 'Cup',
        size: 100,
        unit: 'g',
        isDefault: true,
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        saturatedFat: null,
        transFat: null,
        fiber: null,
        sugar: null,
        sodium: null,
        cholesterol: null,
        vitaminA: null,
        vitaminC: null,
        calcium: null,
        iron: null,
        status: ServingStatus.VERIFIED,
        dataSource: 'USER_ENTERED',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockPaginatedResponse = {
    data: [mockFoodResponse],
    meta: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    },
  };

  const mockFoodsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    search: jest.fn(),
    createFood: jest.fn(),
    updateFood: jest.fn(),
    removeFood: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodsController],
      providers: [
        {
          provide: FoodsService,
          useValue: mockFoodsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<FoodsController>(FoodsController);
    service = module.get<FoodsService>(FoodsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateFoodDto = {
      name: 'New Food',
      variant: 'Spicy',
      brand: 'TestCo',
    };

    it('should create a new food', async () => {
      mockFoodsService.createFood.mockResolvedValue(mockFoodResponse);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockFoodResponse);
      expect(service.createFood).toHaveBeenCalledWith(createDto);
      expect(service.createFood).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    const updateDto: UpdateFoodDto = {
      name: 'Updated Food',
      variant: 'Sweet',
    };

    it('should update an existing food', async () => {
      const updatedFood = { ...mockFoodResponse, name: 'Updated Food', variant: 'Sweet' };
      mockFoodsService.updateFood.mockResolvedValue(updatedFood);

      const result = await controller.update('food-1', updateDto);

      expect(result).toEqual(updatedFood);
      expect(service.updateFood).toHaveBeenCalledWith('food-1', updateDto);
      expect(service.updateFood).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if food does not exist', async () => {
      mockFoodsService.updateFood.mockRejectedValue(
        new NotFoundException('Food with ID invalid-id not found'),
      );

      await expect(controller.update('invalid-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.updateFood).toHaveBeenCalledWith('invalid-id', updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a food', async () => {
      mockFoodsService.removeFood.mockResolvedValue({ id: 'food-1' });

      const result = await controller.remove('food-1');

      expect(result).toEqual({ id: 'food-1' });
      expect(service.removeFood).toHaveBeenCalledWith('food-1');
      expect(service.removeFood).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if food does not exist', async () => {
      mockFoodsService.removeFood.mockRejectedValue(
        new NotFoundException('Food with ID invalid-id not found'),
      );

      await expect(controller.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(service.removeFood).toHaveBeenCalledWith('invalid-id');
    });
  });

  describe('findAll', () => {
    it('should return paginated foods with default pagination', async () => {
      mockFoodsService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(1, 20);

      expect(result).toEqual(mockPaginatedResponse);
      expect(service.findAll).toHaveBeenCalledWith(1, 20);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle custom page number', async () => {
      const page2Response = {
        ...mockPaginatedResponse,
        meta: { ...mockPaginatedResponse.meta, page: 2 },
      };
      mockFoodsService.findAll.mockResolvedValue(page2Response);

      const result = await controller.findAll(2, 20);

      expect(result.meta.page).toBe(2);
      expect(service.findAll).toHaveBeenCalledWith(2, 20);
    });

    it('should handle custom limit', async () => {
      const customLimitResponse = {
        ...mockPaginatedResponse,
        meta: { ...mockPaginatedResponse.meta, limit: 10 },
      };
      mockFoodsService.findAll.mockResolvedValue(customLimitResponse);

      const result = await controller.findAll(1, 10);

      expect(result.meta.limit).toBe(10);
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should return empty array when no foods exist', async () => {
      const emptyResponse = {
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      mockFoodsService.findAll.mockResolvedValue(emptyResponse);

      const result = await controller.findAll(1, 20);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('search', () => {
    it('should return matching foods for valid query', async () => {
      const searchResults = [mockFoodResponse];
      mockFoodsService.search.mockResolvedValue(searchResults);

      const result = await controller.search('rice');

      expect(result).toEqual(searchResults);
      expect(service.search).toHaveBeenCalledWith('rice');
      expect(service.search).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no matches found', async () => {
      mockFoodsService.search.mockResolvedValue([]);

      const result = await controller.search('nonexistent');

      expect(result).toEqual([]);
      expect(service.search).toHaveBeenCalledWith('nonexistent');
    });

    it('should handle case-insensitive search', async () => {
      mockFoodsService.search.mockResolvedValue([mockFoodResponse]);

      const result = await controller.search('RICE');

      expect(result).toEqual([mockFoodResponse]);
      expect(service.search).toHaveBeenCalledWith('RICE');
    });

    it('should handle search with special characters', async () => {
      mockFoodsService.search.mockResolvedValue([]);

      await controller.search('rice & beans');

      expect(service.search).toHaveBeenCalledWith('rice & beans');
    });

    it('should return empty array for empty query', async () => {
      mockFoodsService.search.mockResolvedValue([]);

      const result = await controller.search('');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return food by id', async () => {
      mockFoodsService.findOne.mockResolvedValue(mockFoodResponse);

      const result = await controller.findOne('food-1');

      expect(result).toEqual(mockFoodResponse);
      expect(service.findOne).toHaveBeenCalledWith('food-1');
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should include servings in response', async () => {
      mockFoodsService.findOne.mockResolvedValue(mockFoodResponse);

      const result = await controller.findOne('food-1');

      expect(result.servings).toBeDefined();
      expect(result.servings.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when food does not exist', async () => {
      mockFoodsService.findOne.mockRejectedValue(
        new NotFoundException('Food with ID invalid-id not found'),
      );

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith('invalid-id');
    });

    it('should handle UUID format ids', async () => {
      const uuidId = '123e4567-e89b-12d3-a456-426614174000';
      mockFoodsService.findOne.mockResolvedValue({
        ...mockFoodResponse,
        id: uuidId,
      });

      const result = await controller.findOne(uuidId);

      expect(result.id).toBe(uuidId);
      expect(service.findOne).toHaveBeenCalledWith(uuidId);
    });
  });

  describe('Authentication', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', FoodsController);
      const guardNames = guards.map((guard: any) => guard.name);

      expect(guardNames).toContain('JwtAuthGuard');
    });
  });
});
