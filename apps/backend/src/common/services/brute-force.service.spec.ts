import { Test, TestingModule } from '@nestjs/testing';
import { BruteForceService } from './brute-force.service';
import { REDIS_CLIENT } from '../../infrastructure/redis';

const mockRedis = {
  exists: jest.fn(),
  ttl: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  log: jest.fn(),
};

describe('BruteForceService', () => {
  let service: BruteForceService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BruteForceService,
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();
    service = module.get<BruteForceService>(BruteForceService);
  });

  describe('isBlocked', () => {
    it('devuelve true si la clave de lockout existe en Redis', async () => {
      mockRedis.exists.mockResolvedValue(1);
      const result = await service.isBlocked('1.2.3.4');
      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('brute_force:lockout:1.2.3.4');
    });

    it('devuelve false si no existe lockout', async () => {
      mockRedis.exists.mockResolvedValue(0);
      expect(await service.isBlocked('1.2.3.4')).toBe(false);
    });

    it('devuelve false si Redis lanza excepción (graceful degradation)', async () => {
      mockRedis.exists.mockRejectedValue(new Error('Redis down'));
      expect(await service.isBlocked('1.2.3.4')).toBe(false);
    });
  });

  describe('recordFailedAttempt', () => {
    it('devuelve true y no incrementa si la IP ya está bloqueada', async () => {
      mockRedis.exists.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(1234);
      const result = await service.recordFailedAttempt('1.2.3.4');
      expect(result).toBe(true);
      expect(mockRedis.incr).not.toHaveBeenCalled();
    });

    it('incrementa el contador y devuelve false si no supera el límite', async () => {
      mockRedis.exists.mockResolvedValue(0);
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue('1'); // getAttempts devuelve 1
      const result = await service.recordFailedAttempt('1.2.3.4');
      expect(result).toBe(false);
      expect(mockRedis.incr).toHaveBeenCalledWith('brute_force:attempts:1.2.3.4');
    });

    it('bloquea la IP y devuelve true al alcanzar MAX_ATTEMPTS (5)', async () => {
      mockRedis.exists.mockResolvedValue(0);
      mockRedis.incr.mockResolvedValue(5);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue('5');
      mockRedis.setEx.mockResolvedValue('OK');
      const result = await service.recordFailedAttempt('1.2.3.4');
      expect(result).toBe(true);
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'brute_force:lockout:1.2.3.4',
        30 * 60,
        'true',
      );
    });

    it('devuelve false si Redis lanza excepción (graceful degradation)', async () => {
      mockRedis.exists.mockRejectedValue(new Error('Redis down'));
      expect(await service.recordFailedAttempt('1.2.3.4')).toBe(false);
    });
  });

  describe('resetAttempts', () => {
    it('borra la clave de intentos en Redis', async () => {
      mockRedis.del.mockResolvedValue(1);
      await service.resetAttempts('1.2.3.4');
      expect(mockRedis.del).toHaveBeenCalledWith('brute_force:attempts:1.2.3.4');
    });
  });

  describe('unblock', () => {
    it('borra tanto la clave de lockout como la de intentos', async () => {
      mockRedis.del.mockResolvedValue(2);
      await service.unblock('1.2.3.4');
      expect(mockRedis.del).toHaveBeenCalledWith([
        'brute_force:lockout:1.2.3.4',
        'brute_force:attempts:1.2.3.4',
      ]);
    });
  });
});