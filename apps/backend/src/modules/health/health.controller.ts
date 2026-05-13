import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Health check controller (versión simple — sin Terminus por ahora).
 *
 * Cuando se cierre el Sprint 1.5 (RedisModule), este controller se
 * mejora con TerminusModule para chequear BD y Redis. Por ahora,
 * solo confirma que el proceso Node está vivo.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check application health' })
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check application readiness' })
  readiness() {
    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Check application liveness' })
  liveness() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  }
}