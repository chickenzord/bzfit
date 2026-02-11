import { Test, TestingModule } from '@nestjs/testing';
import { ServingsController } from './servings.controller';
import { FoodsService } from '../foods/foods.service';
import { JwtAuthGuard } from '../../auth/guards';
import { NotFoundException } from '@nestjs/common';
import { ServingResponseDto } from '../../../../shared/dto';

describe('ServingsController', () => {
  let controller: ServingsController;
  let service: FoodsService;

  const mockServingResponse: ServingResponseDto = {
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
    status: 'VERIFIED',
    dataSource: 'USER_ENTERED',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockFoodsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    search: jest.fn(),
    findServing: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServingsController],
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

    controller = module.get<ServingsController>(ServingsController);
    service = module.get<FoodsService>(FoodsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return serving by id', async () => {
      mockFoodsService.findServing.mockResolvedValue(mockServingResponse);

      const result = await controller.findOne('serving-1');

      expect(result).toEqual(mockServingResponse);
      expect(service.findServing).toHaveBeenCalledWith('serving-1');
      expect(service.findServing).toHaveBeenCalledTimes(1);
    });

    it('should include nutrition data in response', async () => {
      mockFoodsService.findServing.mockResolvedValue(mockServingResponse);

      const result = await controller.findOne('serving-1');

      expect(result.calories).toBeDefined();
      expect(result.protein).toBeDefined();
      expect(result.carbs).toBeDefined();
      expect(result.fat).toBeDefined();
    });

    it('should throw NotFoundException when serving does not exist', async () => {
      mockFoodsService.findServing.mockRejectedValue(
        new NotFoundException('Serving with ID invalid-id not found'),
      );

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findServing).toHaveBeenCalledWith('invalid-id');
    });

    it('should handle servings with partial nutrition data', async () => {
      const partialNutrition = {
        ...mockServingResponse,
        saturatedFat: null,
        fiber: null,
        sugar: null,
      };
      mockFoodsService.findServing.mockResolvedValue(partialNutrition);

      const result = await controller.findOne('serving-1');

      expect(result.calories).toBeDefined();
      expect(result.saturatedFat).toBeNull();
      expect(result.fiber).toBeNull();
    });
  });

  describe('Authentication', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', ServingsController);
      const guardNames = guards.map((guard: any) => guard.name);

      expect(guardNames).toContain('JwtAuthGuard');
    });
  });
});
