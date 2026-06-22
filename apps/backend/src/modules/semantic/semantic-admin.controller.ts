import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SecureAuthEndpoint } from '../../common/decorators';
import { RequireRoles } from '../../common/decorators';
import { Role } from '../users/enums';
import { SemanticIndexerService } from './semantic-indexer.service';

@ApiTags('🔧 Admin · Semantic')
@Controller('admin/semantic')
export class SemanticAdminController {
  constructor(private readonly indexer: SemanticIndexerService) {}

  @Post('reindex')
  @SecureAuthEndpoint()
  @RequireRoles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Backfill del índice semántico (background)' })
  reindex() {
    void this.indexer.reindexAll(100); // fire-and-forget; responde 202
    return { message: 'Reindexación lanzada en background' };
  }

  @Get('status')
  @SecureAuthEndpoint()
  @RequireRoles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Estado del índice semántico' })
  async status() {
    const [total, pending] = await Promise.all([
      this.indexer.countTotal(),
      this.indexer.countPending(),
    ]);
    return { total, indexed: total - pending, pending, enabled: this.indexer.enabled };
  }
}