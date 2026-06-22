import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SecureOrgEndpoint, CurrentOrg } from '../../common/decorators';
import { ZodBody } from '../../common/zod';
import { KanbanService } from './kanban.service';
import {
  createCardSchema,
  moveCardSchema,
  createColumnSchema,
  updateColumnSchema,
  reorderColumnsSchema,
  type CreateCardDto,
  type MoveCardDto,
  type CreateColumnDto,
  type UpdateColumnDto,
  type ReorderColumnsDto,
} from './dto';

@ApiTags('Kanban')
@ApiBearerAuth('access_token')
@Controller({ path: 'kanban', version: '1' })
@SecureOrgEndpoint()
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  @Get('board')
  @ApiOperation({ summary: 'Obtener el tablero Kanban de la organización' })
  getBoard(@CurrentOrg() organizationId: string) {
    return this.kanbanService.getBoard(organizationId);
  }

  @Post('cards')
  @ApiOperation({ summary: 'Añadir una tarjeta al tablero' })
  addCard(
    @CurrentOrg() organizationId: string,
    @ZodBody(createCardSchema) dto: CreateCardDto,
  ) {
    return this.kanbanService.addCard(organizationId, dto);
  }

  @Patch('cards/:id/move')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Mover una tarjeta de columna o cambiar su posición' })
  moveCard(
    @CurrentOrg() organizationId: string,
    @Param('id') id: string,
    @ZodBody(moveCardSchema) dto: MoveCardDto,
  ) {
    return this.kanbanService.moveCard(organizationId, id, dto);
  }

  @Delete('cards/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Eliminar una tarjeta del tablero' })
  removeCard(
    @CurrentOrg() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.kanbanService.removeCard(organizationId, id);
  }

  @Post('columns')
  @ApiOperation({ summary: 'Crear una nueva columna en el tablero' })
  createColumn(
    @CurrentOrg() organizationId: string,
    @ZodBody(createColumnSchema) dto: CreateColumnDto,
  ) {
    return this.kanbanService.createColumn(organizationId, dto);
  }

  @Patch('columns/reorder')
  @ApiOperation({ summary: 'Reordenar las columnas del tablero' })
  reorderColumns(
    @CurrentOrg() organizationId: string,
    @ZodBody(reorderColumnsSchema) dto: ReorderColumnsDto,
  ) {
    return this.kanbanService.reorderColumns(organizationId, dto);
  }

  @Patch('columns/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Actualizar una columna del tablero' })
  updateColumn(
    @CurrentOrg() organizationId: string,
    @Param('id') id: string,
    @ZodBody(updateColumnSchema) dto: UpdateColumnDto,
  ) {
    return this.kanbanService.updateColumn(organizationId, id, dto);
  }
}
