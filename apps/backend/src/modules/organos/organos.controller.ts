import { Controller, Get, Param} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrganosService } from './organos.service';
import { ZodQuery } from '../../common/zod';
import { searchOrganosSchema, type SearchOrganosDto } from './dto/search-organos.dto';

@ApiTags('Órganos de contratación')
@Controller('organos')
export class OrganosController {
  constructor(private readonly organosService: OrganosService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Autocompletar órganos de contratación',
    description:
      'Búsqueda incremental con filtrado por CCAA/provincia. Limitado a 30 resultados.',
  })
  async search(@ZodQuery(searchOrganosSchema) dto: SearchOrganosDto) {
    return this.organosService.search(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un órgano por ID' })
  async findById(@Param('id') id: string) {
    return this.organosService.findById(id);
  }
}