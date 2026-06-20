import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SecureAuthEndpoint, CurrentUser } from '../../common/decorators';
import { DashboardService } from './dashboard.service';
import { vencimientosQuerySchema } from './dto';

@ApiTags('Dashboard')
@ApiBearerAuth('access_token')
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @SecureAuthEndpoint()
  @ApiOperation({ summary: 'Métricas resumen del usuario' })
  summary(@CurrentUser() userId: string) {
    return this.dashboardService.summary(userId);
  }

  @Get('vencimientos')
  @SecureAuthEndpoint()
  @ApiOperation({ summary: 'Plazos de presentación próximos de mis guardadas' })
  vencimientos(@CurrentUser() userId: string, @Query('days') days?: string) {
    const { days: parsed } = vencimientosQuerySchema.parse({ days });
    return this.dashboardService.vencimientos(userId, parsed);
  }

  @Get('distribucion')
  @SecureAuthEndpoint()
  @ApiOperation({ summary: 'Distribución de mis guardadas por tipo y CCAA' })
  distribucion(@CurrentUser() userId: string) {
    return this.dashboardService.distribucion(userId);
  }

  @Get('series')
  @SecureAuthEndpoint()
  @ApiOperation({ summary: 'Publicaciones por semana' })
  series(@CurrentUser() userId: string) {
    return this.dashboardService.series(userId);
  }
}