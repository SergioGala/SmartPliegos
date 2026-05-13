import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../../infrastructure/redis';
import type { RedisClientType } from '../../infrastructure/redis';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClientType,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // BD respondiendo
      () => this.db.pingCheck('database'),
      // Redis respondiendo
      async () => {
        try {
          await this.redis.ping();
          return { redis: { status: 'up' } };
        } catch {
          return { redis: { status: 'down' } };
        }
      },
    ]);
  }
}