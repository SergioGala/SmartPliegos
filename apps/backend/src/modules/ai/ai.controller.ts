import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('Health')
@Controller('health/ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get()
  @ApiOperation({ summary: 'Health check de proveedores IA' })
  health() {
    return this.ai.health();
  }
}