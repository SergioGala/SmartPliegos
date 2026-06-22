import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { SecureAuthEndpoint } from '../../common/decorators';
import { ZodQuery } from '../../common/zod';
import { PliegosService } from './pliegos.service';
import { searchPliegoSchema, type SearchPliegoDto } from './dto';

@ApiTags('📄 Pliegos')
@ApiBearerAuth('access_token')
@Controller('pliegos')
export class PliegosController {
  constructor(private readonly pliegosService: PliegosService) {}

  @Get('licitacion/:licitacionId')
  @SecureAuthEndpoint()
  @ApiParam({ name: 'licitacionId', format: 'uuid' })
  @ApiOperation({ summary: 'Listar los pliegos descargados de una licitación' })
  findByLicitacion(@Param('licitacionId', ParseUUIDPipe) licitacionId: string) {
    return this.pliegosService.findByLicitacion(licitacionId);
  }

  @Post('licitacion/:licitacionId/sync')
  @SecureAuthEndpoint()
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'licitacionId', format: 'uuid' })
  @ApiOperation({ summary: 'Descargar e indexar los pliegos de la licitación' })
  sync(@Param('licitacionId', ParseUUIDPipe) licitacionId: string) {
    return this.pliegosService.sync(licitacionId);
  }

  @Get(':id/file')
  @SecureAuthEndpoint()
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Servir el PDF del pliego (stream)' })
  async file(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, mimeType, filename } = await this.pliegosService.getFile(id);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
    });
    return new StreamableFile(stream);
  }

  @Get(':id/search')
  @SecureAuthEndpoint()
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({ name: 'q', required: true, description: 'Texto a buscar (mín. 2 caracteres)' })
  @ApiOperation({ summary: 'Buscar texto dentro del pliego (snippets)' })
  search(
    @Param('id', ParseUUIDPipe) id: string,
    @ZodQuery(searchPliegoSchema) query: SearchPliegoDto,
  ) {
    return this.pliegosService.search(id, query.q);
  }
}
