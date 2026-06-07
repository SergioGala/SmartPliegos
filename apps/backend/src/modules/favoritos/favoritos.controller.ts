import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SecureAuthEndpoint, CurrentUser } from '../../common/decorators';
import { ZodBody } from '../../common/zod';
import { FavoritosService } from './favoritos.service';
import {
  createFavoritoSchema,
  updateFavoritoSchema,
  type CreateFavoritoDto,
  type UpdateFavoritoDto,
} from './dto';

@ApiTags('Favoritos')
@ApiBearerAuth('access_token')
@Controller({ path: 'favoritos', version: '1' })
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  @Post()
  @SecureAuthEndpoint()
  @ApiOperation({ summary: 'Guardar una licitación en favoritos' })
  create(@CurrentUser() userId: string, @ZodBody(createFavoritoSchema) dto: CreateFavoritoDto) {
    return this.favoritosService.create(userId, dto);
  }

  @Get()
  @SecureAuthEndpoint()
  @ApiOperation({ summary: 'Listar mis favoritos' })
  findAll(@CurrentUser() userId: string) {
    return this.favoritosService.findAllByUser(userId);
  }

  @Get('ids')
  @SecureAuthEndpoint()
  @ApiOperation({ summary: 'IDs favoritos para marcar el corazón en el buscador' })
  findIds(@CurrentUser() userId: string) {
    return this.favoritosService.findLicitacionIds(userId);
  }

  @Patch(':id')
  @SecureAuthEndpoint()
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Actualizar la nota de un favorito' })
  updateNota(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @ZodBody(updateFavoritoSchema) dto: UpdateFavoritoDto,
  ) {
    return this.favoritosService.updateNota(userId, id, dto);
  }

  @Delete(':id')
  @SecureAuthEndpoint()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Eliminar un favorito por id' })
  remove(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.favoritosService.remove(userId, id);
  }

  @Delete('licitacion/:licitacionId')
  @SecureAuthEndpoint()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'licitacionId', format: 'uuid' })
  @ApiOperation({ summary: 'Eliminar un favorito por licitación' })
  removeByLicitacion(@CurrentUser() userId: string, @Param('licitacionId') licitacionId: string) {
    return this.favoritosService.removeByLicitacion(userId, licitacionId);
  }
}