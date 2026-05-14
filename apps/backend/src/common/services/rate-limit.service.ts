import { Inject, Injectable, Logger } from '@nestjs/common';
import { REDIS_CLIENT } from '../../infrastructure/redis';
import type { RedisClientType } from 'redis';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  async isAllowed(
    identifier: string,
    endpoint: string,
    limit: number = 100,
    windowMs: number = 60 * 1000,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const key = this.generateKey(endpoint, identifier);
      const windowSeconds = Math.ceil(windowMs / 1000);

      const count = await this.redisClient.get(key);
      const currentCount = count ? parseInt(count) : 0;
      const ttl = await this.redisClient.ttl(key);
      const isNewKey = ttl === -1 || ttl === -2;

      if (isNewKey) {
        await this.redisClient.setEx(key, windowSeconds, '1');
        return { allowed: true, remaining: limit - 1, resetTime: Date.now() + windowMs };
      }

      if (currentCount >= limit) {
        return { allowed: false, remaining: 0, resetTime: Date.now() + ttl * 1000 };
      }

      const newCount = await this.redisClient.incr(key);
      return { allowed: true, remaining: limit - newCount, resetTime: Date.now() + ttl * 1000 };
    } catch (error) {
      this.logger.error('Error en isAllowed:', error);
      return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs };
    }
  }

  async resetCounter(identifier: string, endpoint: string): Promise<void> {
    try {
      const key = this.generateKey(endpoint, identifier);
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error('Error en resetCounter:', error);
    }
  }

  async getInfo(
    identifier: string,
    endpoint: string,
    limit: number,
  ): Promise<{ currentCount: number; limit: number; remaining: number; ttl: number }> {
    try {
      const key = this.generateKey(endpoint, identifier);
      const count = await this.redisClient.get(key);
      const currentCount = count ? parseInt(count) : 0;
      let ttl = await this.redisClient.ttl(key);
      if (ttl === -1 || ttl === -2) ttl = 0;
      return { currentCount, limit, remaining: Math.max(0, limit - currentCount), ttl };
    } catch (error) {
      this.logger.error('Error en getInfo:', error);
      return { currentCount: 0, limit, remaining: limit, ttl: 0 };
    }
  }

  private generateKey(endpoint: string, identifier: string): string {
    const normalizedEndpoint = endpoint
      .replace(/^\//, '')
      .replace(/\//g, '_')
      .replace(/:/g, '_');
    return `rate_limit:${normalizedEndpoint}:${identifier}`;
  }
}