import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { BruteForceService } from '../../common/services/brute-force.service';
import { REDIS_CLIENT } from '../../infrastructure/redis';
import { UnauthorizedException } from '@nestjs/common';
import { Role, Plan } from '../users/enums';
import { OAUTH_GOOGLE_PROVIDER } from '../../infrastructure/oauth';
import { OrganizationsService } from '../users/modules/organizations/organizations.service';

const mockUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: Role.PUBLIC_USER,
  isActive: true,
  organizationId: null,
  userPlan: Plan.FREE,
  password: 'hashed-password',
};

const mockGoogleOAuthProvider = {
  providerName: 'google' as const,
  normalizeProfile: jest.fn().mockReturnValue({
    externalId: 'g-mock',
    provider: 'google',
    email: 'mock@gmail.com',
    emailVerified: true,
    firstName: 'Mock',
    lastName: 'User',
    pictureUrl: null,
  }),
};

const mockUsersService = {
  findByEmailWithPassword: jest.fn(),
  validatePassword: jest.fn(),
  findOne: jest.fn(),
  createIncompleteUser: jest.fn(),
  sendSignupVerificationEmail: jest.fn(),
  completeSignupWithPassword: jest.fn(),
  findByGoogleId: jest.fn(),
  findByEmail: jest.fn(),
  createUserWithGoogle: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
};

const mockBruteForceService = {
  recordFailedAttempt: jest.fn(),
  resetAttempts: jest.fn(),
  isBlocked: jest.fn(),
};

const mockRedis = {
  set: jest.fn(),
  get: jest.fn(),
  exists: jest.fn(),
};

const mockOrganizationsService = {
  ensureOrganizationForUser: jest.fn().mockImplementation((user) => Promise.resolve(user)),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: BruteForceService, useValue: mockBruteForceService },
        { provide: OrganizationsService, useValue: mockOrganizationsService },
        { provide: REDIS_CLIENT, useValue: mockRedis },
        { provide: OAUTH_GOOGLE_PROVIDER, useValue: mockGoogleOAuthProvider },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('devuelve tokens cuando las credenciales son válidas', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockBruteForceService.resetAttempts.mockResolvedValue(undefined);

      const result = await service.login(
        { email: 'test@example.com', password: 'correct-password' },
        '1.2.3.4',
      );

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user).not.toHaveProperty('password');
      expect(mockBruteForceService.resetAttempts).toHaveBeenCalledWith('1.2.3.4');
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(null);
      mockBruteForceService.recordFailedAttempt.mockResolvedValue(false);

      await expect(
        service.login({ email: 'noexiste@example.com', password: 'pass' }, '1.2.3.4'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockBruteForceService.recordFailedAttempt).toHaveBeenCalledWith('1.2.3.4');
    });

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);
      mockBruteForceService.recordFailedAttempt.mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }, '1.2.3.4'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario está desactivado', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'pass' }, '1.2.3.4'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout y blacklist de refresh tokens', () => {
    it('logout guarda el hash del token en Redis con TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');
      await service.logout('my-refresh-token');
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^refresh:blacklist:/),
        '1',
        { EX: 7 * 24 * 60 * 60 },
      );
    });

    it('refreshToken lanza UnauthorizedException si el token está en blacklist', async () => {
      mockRedis.get.mockResolvedValue('1'); // token en blacklist
      await expect(
        service.refreshToken({ refresh_token: 'blacklisted-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('refreshToken rota el token correctamente si es válido', async () => {
      mockRedis.get.mockResolvedValue(null); // no en blacklist
      mockJwtService.verify.mockReturnValue({
  sub: 'user-uuid-1',
  email: 'test@example.com',
  role: Role.PUBLIC_USER,
  isActive: true,
  type: 'refresh', 
});

      const result = await service.refreshToken({ refresh_token: 'valid-token' });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCurrentUser', () => {
    it('devuelve el usuario si existe y está activo', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      const result = await service.getCurrentUser('user-uuid-1');
      expect(result).toEqual(mockUser);
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      await expect(service.getCurrentUser('no-existe')).rejects.toThrow();
    });
  });
});