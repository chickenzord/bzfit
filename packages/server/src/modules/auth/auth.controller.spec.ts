import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { RegisterDto, LoginDto, CreateApiKeyDto } from './dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date('2024-01-01'),
  };

  const mockAuthResponse = {
    user: mockUser,
    access_token: 'mock-jwt-token',
  };

  const mockApiKey = {
    id: 'api-key-1',
    key: 'abc123def456',
    name: 'Test API Key',
    scopes: ['read:meals', 'write:meals'],
    expiresAt: null,
    createdAt: new Date('2024-01-01'),
  };

  const mockApiKeyList = {
    id: 'api-key-1',
    name: 'Test API Key',
    scopes: ['read:meals'],
    expiresAt: null,
    lastUsed: null,
    createdAt: new Date('2024-01-01'),
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    createApiKey: jest.fn(),
    listApiKeys: jest.fn(),
    revokeApiKey: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user-1', email: 'test@example.com' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should register a new user successfully', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResponse);
      expect(result.user).toBeDefined();
      expect(result.access_token).toBeDefined();
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(service.register).toHaveBeenCalledTimes(1);
    });

    it('should return user without password hash', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('name');
    });

    it('should throw ConflictException when user already exists', async () => {
      mockAuthService.register.mockRejectedValue(
        new ConflictException('User with this email already exists'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });

    it('should handle registration with valid email format', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.com',
      ];

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      for (const email of validEmails) {
        await controller.register({ ...registerDto, email });
        expect(service.register).toHaveBeenCalledWith({ ...registerDto, email });
      }
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(result.user).toBeDefined();
      expect(result.access_token).toBeDefined();
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
    });

    it('should return JWT token on successful login', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(typeof result.access_token).toBe('string');
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        controller.login({ ...loginDto, email: 'wrong@example.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        controller.login({ ...loginDto, password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not expose password in response', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('createApiKey', () => {
    const createApiKeyDto: CreateApiKeyDto = {
      name: 'Test API Key',
      scopes: ['read:meals', 'write:meals'],
    };

    it('should create an API key successfully', async () => {
      mockAuthService.createApiKey.mockResolvedValue(mockApiKey);

      const result = await controller.createApiKey(mockRequest, createApiKeyDto);

      expect(result).toEqual(mockApiKey);
      expect(result.key).toBeDefined();
      expect(result.scopes).toEqual(['read:meals', 'write:meals']);
      expect(service.createApiKey).toHaveBeenCalledWith('user-1', createApiKeyDto);
      expect(service.createApiKey).toHaveBeenCalledTimes(1);
    });

    it('should create API key with user ID from request', async () => {
      mockAuthService.createApiKey.mockResolvedValue(mockApiKey);

      await controller.createApiKey(mockRequest, createApiKeyDto);

      expect(service.createApiKey).toHaveBeenCalledWith(
        mockRequest.user.id,
        createApiKeyDto,
      );
    });

    it('should create API key with expiration date', async () => {
      const expiringKeyDto = {
        ...createApiKeyDto,
        expiresAt: '2025-01-01T00:00:00.000Z',
      };
      const expiringKey = {
        ...mockApiKey,
        expiresAt: new Date('2025-01-01'),
      };
      mockAuthService.createApiKey.mockResolvedValue(expiringKey);

      const result = await controller.createApiKey(mockRequest, expiringKeyDto);

      expect(result.expiresAt).toBeDefined();
      expect(service.createApiKey).toHaveBeenCalledWith('user-1', expiringKeyDto);
    });

    it('should create API key with custom scopes', async () => {
      const customScopesDto = {
        ...createApiKeyDto,
        scopes: ['read:foods', 'read:meals', 'write:meals'],
      };
      mockAuthService.createApiKey.mockResolvedValue({
        ...mockApiKey,
        scopes: customScopesDto.scopes,
      });

      const result = await controller.createApiKey(mockRequest, customScopesDto);

      expect(result.scopes).toEqual(customScopesDto.scopes);
      expect(result.scopes.length).toBe(3);
    });
  });

  describe('listApiKeys', () => {
    it('should list all API keys for the current user', async () => {
      mockAuthService.listApiKeys.mockResolvedValue([mockApiKeyList]);

      const result = await controller.listApiKeys(mockRequest);

      expect(result).toEqual([mockApiKeyList]);
      expect(Array.isArray(result)).toBe(true);
      expect(service.listApiKeys).toHaveBeenCalledWith('user-1');
      expect(service.listApiKeys).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when user has no API keys', async () => {
      mockAuthService.listApiKeys.mockResolvedValue([]);

      const result = await controller.listApiKeys(mockRequest);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should not include API key secret in list', async () => {
      mockAuthService.listApiKeys.mockResolvedValue([mockApiKeyList]);

      const result = await controller.listApiKeys(mockRequest);

      result.forEach(apiKey => {
        expect(apiKey).not.toHaveProperty('key');
      });
    });

    it('should include API key metadata in list', async () => {
      mockAuthService.listApiKeys.mockResolvedValue([mockApiKeyList]);

      const result = await controller.listApiKeys(mockRequest);

      result.forEach(apiKey => {
        expect(apiKey).toHaveProperty('id');
        expect(apiKey).toHaveProperty('name');
        expect(apiKey).toHaveProperty('scopes');
        expect(apiKey).toHaveProperty('createdAt');
      });
    });

    it('should parse scopes as array', async () => {
      mockAuthService.listApiKeys.mockResolvedValue([mockApiKeyList]);

      const result = await controller.listApiKeys(mockRequest);

      expect(Array.isArray(result[0].scopes)).toBe(true);
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key successfully', async () => {
      const successMessage = { message: 'API key revoked successfully' };
      mockAuthService.revokeApiKey.mockResolvedValue(successMessage);

      const result = await controller.revokeApiKey(mockRequest, 'api-key-1');

      expect(result).toEqual(successMessage);
      expect(service.revokeApiKey).toHaveBeenCalledWith('user-1', 'api-key-1');
      expect(service.revokeApiKey).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when API key does not exist', async () => {
      mockAuthService.revokeApiKey.mockRejectedValue(
        new NotFoundException('API key not found'),
      );

      await expect(
        controller.revokeApiKey(mockRequest, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
      expect(service.revokeApiKey).toHaveBeenCalledWith('user-1', 'invalid-id');
    });

    it('should throw NotFoundException when trying to revoke another users API key', async () => {
      mockAuthService.revokeApiKey.mockRejectedValue(
        new NotFoundException('API key not found'),
      );

      await expect(
        controller.revokeApiKey(mockRequest, 'other-users-key'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should verify user ownership before revoking', async () => {
      mockAuthService.revokeApiKey.mockResolvedValue({
        message: 'API key revoked successfully'
      });

      await controller.revokeApiKey(mockRequest, 'api-key-1');

      expect(service.revokeApiKey).toHaveBeenCalledWith(
        mockRequest.user.id,
        'api-key-1',
      );
    });
  });

  describe('Authentication', () => {
    it('should protect API key endpoints with JwtAuthGuard', () => {
      const createKeyGuards = Reflect.getMetadata(
        '__guards__',
        AuthController.prototype.createApiKey,
      );
      const listKeysGuards = Reflect.getMetadata(
        '__guards__',
        AuthController.prototype.listApiKeys,
      );
      const revokeKeyGuards = Reflect.getMetadata(
        '__guards__',
        AuthController.prototype.revokeApiKey,
      );

      expect(createKeyGuards).toBeDefined();
      expect(listKeysGuards).toBeDefined();
      expect(revokeKeyGuards).toBeDefined();
    });

    it('should not protect register endpoint', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        AuthController.prototype.register,
      );

      expect(guards).toBeUndefined();
    });

    it('should not protect login endpoint', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        AuthController.prototype.login,
      );

      expect(guards).toBeUndefined();
    });
  });
});
