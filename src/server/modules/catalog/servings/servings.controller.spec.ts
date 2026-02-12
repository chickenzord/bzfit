import { Test, TestingModule } from '@nestjs/testing';
import { ServingsController } from './servings.controller';
import { ServingsService } from './servings.service'; // Import ServingsService
import { JwtAuthGuard } from '../../auth/guards';
import { NotFoundException, HttpStatus } from '@nestjs/common';
import { ServingResponseDto, CreateServingDto, UpdateServingDto } from '../../../../shared/dto';
import { ServingStatus } from '@prisma/client';

describe('ServingsController', () => {
  let controller: ServingsController;
  let service: ServingsService; // Use ServingsService

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
    status: ServingStatus.VERIFIED,
    dataSource: 'USER_ENTERED',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockServingsService = { // Mock ServingsService
    createServing: jest.fn(),
    updateServing: jest.fn(),
    removeServing: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServingsController],
      providers: [
        {
          provide: ServingsService, // Provide ServingsService
          useValue: mockServingsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ServingsController>(ServingsController);
    service = module.get<ServingsService>(ServingsService); // Get ServingsService
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateServingDto = {
        foodId: 'food-1',
        name: 'New Serving',
        size: 50,
        unit: 'ml',
        calories: 50,
        protein: 1,
        carbs: 5,
        fat: 2,
        isDefault: false,
    };

    it('should create a new serving', async () => {
      mockServingsService.createServing.mockResolvedValue(mockServingResponse);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockServingResponse);
      expect(service.createServing).toHaveBeenCalledWith(createDto.foodId, createDto);
      expect(service.createServing).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if food does not exist', async () => {
      mockServingsService.createServing.mockRejectedValue(
        new NotFoundException(`Food with ID ${createDto.foodId} not found`),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.createServing).toHaveBeenCalledWith(createDto.foodId, createDto);
    });
  });

  describe('update', () => {
    const updateDto: UpdateServingDto = {
        name: 'Updated Serving',
        calories: 60,
    };

    it('should update an existing serving', async () => {
      const updatedServing = { ...mockServingResponse, name: 'Updated Serving', calories: 60 };
      mockServingsService.updateServing.mockResolvedValue(updatedServing);

      const result = await controller.update('serving-1', updateDto);

      expect(result).toEqual(updatedServing);
      expect(service.updateServing).toHaveBeenCalledWith('serving-1', updateDto);
      expect(service.updateServing).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if serving does not exist', async () => {
      mockServingsService.updateServing.mockRejectedValue(
        new NotFoundException('Serving with ID invalid-id not found'),
      );

      await expect(controller.update('invalid-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.updateServing).toHaveBeenCalledWith('invalid-id', updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a serving', async () => {
      mockServingsService.removeServing.mockResolvedValue({ id: 'serving-1' });

      const result = await controller.remove('serving-1');

      expect(result).toEqual({ id: 'serving-1' });
      expect(service.removeServing).toHaveBeenCalledWith('serving-1');
      expect(service.removeServing).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if serving does not exist', async () => {
      mockServingsService.removeServing.mockRejectedValue(
        new NotFoundException('Serving with ID invalid-id not found'),
      );

      await expect(controller.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(service.removeServing).toHaveBeenCalledWith('invalid-id');
    });
  });

  describe('findOne', () => {
    it('should return serving by id', async () => {
      mockServingsService.findOne.mockResolvedValue(mockServingResponse); // Use mockServingsService

      const result = await controller.findOne('serving-1');

      expect(result).toEqual(mockServingResponse);
      expect(service.findOne).toHaveBeenCalledWith('serving-1');
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should include nutrition data in response', async () => {
      mockServingsService.findOne.mockResolvedValue(mockServingResponse); // Use mockServingsService

      const result = await controller.findOne('serving-1');

      expect(result.calories).toBeDefined();
      expect(result.protein).toBeDefined();
      expect(result.carbs).toBeDefined();
      expect(result.fat).toBeDefined();
    });

    it('should throw NotFoundException when serving does not exist', async () => {
      mockServingsService.findOne.mockRejectedValue( // Use mockServingsService
        new NotFoundException('Serving with ID invalid-id not found'),
      );

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith('invalid-id');
    });

    it('should handle servings with partial nutrition data', async () => {
      const partialNutrition = {
        ...mockServingResponse,
        saturatedFat: null,
        fiber: null,
        sugar: null,
      };
      mockServingsService.findOne.mockResolvedValue(partialNutrition); // Use mockServingsService

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
