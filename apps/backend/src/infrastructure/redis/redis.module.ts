import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { REDIS_CLIENT } from './redis.tokens';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<RedisClientType> => {
        const logger = new Logger('RedisModule');
        const url = configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

        const client = createClient({ url }) as RedisClientType;

        client.on('error', (err: Error) => logger.error(`Redis error: ${err.message}`));
        client.on('connect', () => logger.log(`Connected to Redis: ${url}`));
        client.on('disconnect', () => logger.warn('Disconnected from Redis'));

        await client.connect();
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}