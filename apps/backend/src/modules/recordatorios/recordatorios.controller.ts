import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SecureAuthEndpoint, CurrentUser } from '../../common/decorators';
import { ZodBody } from '../../common/zod';
import { RecordatoriosService } from './recordatorios.service';
import {
  upsertRecordatorioSchema,
  type UpsertRecordatorioDto,
  UpsertRecordatorioDtoSwagger,
} from './dto/upsert-recordatorio.dto';

@ApiTags('Recordatorios')
@ApiBearerAuth('access_token')
@Controller('recordatorios')
export class RecordatoriosController {
  constructor(private readonly service: RecordatoriosService) {}

  @Get('calendario')
  @SecureAuthEndpoint()
  @ApiOperation({ summary: 'Eventos del calendario (plazos de favoritos + recordatorios)' })
  calendario(@CurrentUser() userId: string) {
    return this.service.getCalendario(userId);
  }

  @Get()
  @SecureAuthEndpoint()
  @ApiOperation({ summary: 'Listar mis recordatorios' })
  list(@CurrentUser() userId: string) {
    return this.service.findAllByUser(userId);
  }

  @Put()
  @SecureAuthEndpoint()
  @ApiBody({ type: UpsertRecordatorioDtoSwagger })
  @ApiOperation({ summary: 'Crear o actualizar el recordatorio de una licitación' })
  upsert(@CurrentUser() userId: string, @ZodBody(upsertRecordatorioSchema) dto: UpsertRecordatorioDto) {
    return this.service.upsert(userId, dto);
  }

  @Delete('licitacion/:licitacionId')
  @SecureAuthEndpoint()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'licitacionId', format: 'uuid' })
  @ApiOperation({ summary: 'Eliminar el recordatorio de una licitación' })
  remove(@CurrentUser() userId: string, @Param('licitacionId') licitacionId: string) {
    return this.service.removeByLicitacion(userId, licitacionId);
  }
}