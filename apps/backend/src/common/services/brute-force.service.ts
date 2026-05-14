import { Inject, Injectable, Logger } from '@nestjs/common';
import { REDIS_CLIENT } from '../../infrastructure/redis';
import type { RedisClientType } from 'redis';

@Injectable()
export class BruteForceService {
  private readonly logger = new Logger(BruteForceService.name);
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_TIME = 15 * 60;
  private readonly LOCKOUT_TIME = 30 * 60;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  async recordFailedAttempt(identifier: string): Promise<boolean> {
    try {
      const lockoutKey = `brute_force:lockout:${identifier}`;
      const attemptsKey = `brute_force:attempts:${identifier}`;

      const isLocked = await this.redisClient.exists(lockoutKey);
      if (isLocked) {
        const timeLeft = await this.redisClient.ttl(lockoutKey);
        this.logger.warn(`IP ${identifier} bloqueada. TTL: ${timeLeft}s`);
        return true;
      }

      await this.redisClient.incr(attemptsKey);
      await this.redisClient.expire(attemptsKey, this.WINDOW_TIME);

      const attempts = await this.getAttempts(identifier);
      this.logger.warn(`IP ${identifier}: ${attempts}/${this.MAX_ATTEMPTS} intentos`);

      if (attempts >= this.MAX_ATTEMPTS) {
        await this.redisClient.setEx(lockoutKey, this.LOCKOUT_TIME, 'true');
        this.logger.warn(`IP ${identifier} bloqueada por ${this.LOCKOUT_TIME}s`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error en recordFailedAttempt:', error);
      return false;
    }
  }

  async isBlocked(identifier: string): Promise<boolean> {
    try {
      const lockoutKey = `brute_force:lockout:${identifier}`;
      const isLocked = await this.redisClient.exists(lockoutKey);
      return isLocked === 1;
    } catch (error) {
      this.logger.error('Error en isBlocked:', error);
      return false;
    }
  }

  async getAttempts(identifier: string): Promise<number> {
    try {
      const attemptsKey = `brute_force:attempts:${identifier}`;
      const attempts = await this.redisClient.get(attemptsKey);
      return attempts ? parseInt(attempts) : 0;
    } catch (error) {
      this.logger.error('Error en getAttempts:', error);
      return 0;
    }
  }

  async resetAttempts(identifier: string): Promise<void> {
    try {
      const attemptsKey = `brute_force:attempts:${identifier}`;
      await this.redisClient.del(attemptsKey);
    } catch (error) {
      this.logger.error('Error en resetAttempts:', error);
    }
  }

  async unblock(identifier: string): Promise<void> {
    try {
      const lockoutKey = `brute_force:lockout:${identifier}`;
      const attemptsKey = `brute_force:attempts:${identifier}`;
      await this.redisClient.del([lockoutKey, attemptsKey]);
      this.logger.log(`IP ${identifier} desbloqueada`);
    } catch (error) {
      this.logger.error('Error en unblock:', error);
    }
  }
}