import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { OrganoContratacion } from '../scraping/shared/entities/organo-contratacion.entity';
import { LicitacionFormatterService } from './services/licitacion-formatter.service';
import { ISearchResponse } from './interfaces/search-response.interface';
import { SearchLicitacionesDto } from './dto/search-licitaciones.dto';
import {
  FILTER_WHITELISTS,
  ORGANOS_FILTER_CONFIG,
  CAMEL_CASE_FIELDS,
} from './licitaciones.constants';

import { SemanticSearchService } from '../semantic/semantic-search.service';



import { LicitacionListItemDto } from './interfaces/licitacion-formatter.interface';

@Injectable()
export class LicitacionesService {
  private readonly logger = new Logger(LicitacionesService.name);

  constructor(
    @InjectRepository(Licitacion)
    private readonly licRepo: Repository<Licitacion>,
    @InjectRepository(OrganoContratacion)
    private readonly orgRepo: Repository<OrganoContratacion>,
    private readonly formatter: LicitacionFormatterService,
    private readonly semanticSearch: SemanticSearchService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }


  /**
   * Buscar licitaciones con filtros avanzados y paginación.
   *
   * Delega a SemanticSearchService, que soporta modo 'text' (default),
   * 'semantic' y 'hybrid'. Ver Sprint 2 · Búsqueda semántica.
   *
   * @param dto - Objeto SearchLicitacionesDto con todos los filtros
   */
  async search(dto: SearchLicitacionesDto): Promise<ISearchResponse<LicitacionListItemDto>> {
    const cacheKey = `search:${JSON.stringify(dto)}`;
    try {
      const cached = await this.cacheManager.get<ISearchResponse<LicitacionListItemDto>>(cacheKey);
      if (cached) {
        this.logger.log(`[Cache Hit] Búsqueda devuelta desde cache para key: ${cacheKey}`);
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Error al leer cache para búsqueda: ${err instanceof Error ? err.message : 'desconocido'}`);
    }

    const result = await this.semanticSearch.search(dto);

    try {
      await this.cacheManager.set(cacheKey, result, 30 * 1000); // cache por 30s
    } catch (err) {
      this.logger.warn(`Error al guardar en cache para búsqueda: ${err instanceof Error ? err.message : 'desconocido'}`);
    }

    return result;
  }


  /**
   * Obtener detalle completo de una licitación por ID
   *
   * Retorna toda la información de una licitación con el órgano de contratación asociado.
   * Incluye datos generales, clasificación, cronograma de plazos e información de ubicación.
   *
   * @param id - UUID de la licitación
   * @returns {Promise<any>} Objeto con detalle formateado
   * @throws {NotFoundException} Si la licitación no existe
   */
  async findById(id: string) {
    const lic = await this.licRepo.findOne({
      where: { id },
      relations: ['organo'],
    });

    if (!lic) {
      throw new NotFoundException(`Licitación ${id} no encontrada`);
    }

    return this.formatter.formatDetail(lic);
  }

  /**
   * Obtener opciones disponibles para los filtros del buscador
   *
   * Retorna agregaciones (count) de todos los valores únicos para cada filtro.
   * Aplica WHITELIST para garantizar solo valores válidos. Los dropdowns se construyen
   * dinámicamente sin hardcodear valores.
   *
   * **Whitelists aplicadas:**
   * - VALID_ESTADOS: 7 valores (ABIERTA, CERRADA, ADJUDICADA, etc.)
   * - VALID_TIPOS: 12 valores de tipos de contrato
   * - VALID_PROCEDIMIENTOS: 14 valores de procedimientos
   * - VALID_TRAMITACIONES: 3 valores (ORDINARIA, URGENTE, EMERGENCIA)
   * - Sin whitelist: CCAA, provincias, órganos (valores dinámicos de BD)
   *
   * @returns {Promise<Object>} Objeto con arrays de opciones:
   *   { estados, tipos, procedimientos, tramitaciones, ccaas, provincias, organos }
   */
  async getFilterOptions() {
    try {
      const [
        estados,
        tipos,
        procedimientos,
        tramitaciones,
        ccaas,
        provincias,
        organos,
      ] = await Promise.all([
        this.queryFilterByField('estado').catch((e) => {
          this.logger.warn('Error fetching estados', e);
          return [];
        }),
        this.queryFilterByField('tipoContrato').catch((e) => {
          this.logger.warn('Error fetching tipos', e);
          return [];
        }),
        this.queryFilterByField('procedimiento').catch((e) => {
          this.logger.warn('Error fetching procedimientos', e);
          return [];
        }),
        this.queryFilterByField('tramitacion').catch((e) => {
          this.logger.warn('Error fetching tramitaciones', e);
          return [];
        }),
        this.queryFilterByField('ccaa', 'ASC').catch((e) => {
          this.logger.warn('Error fetching ccaas', e);
          return [];
        }),
        this.queryFilterByField('provincia', 'ASC').catch((e) => {
          this.logger.warn('Error fetching provincias', e);
          return [];
        }),
        this.getOrganosWithCounts(),
      ]);

      return {
        estados: this.applyWhitelist(estados, FILTER_WHITELISTS.estado),
        tipos: this.applyWhitelist(tipos, FILTER_WHITELISTS.tipoContrato),
        procedimientos: this.applyWhitelist(
          procedimientos,
          FILTER_WHITELISTS.procedimiento,
        ),
        tramitaciones: this.applyWhitelist(
          tramitaciones,
          FILTER_WHITELISTS.tramitacion,
        ),
        ccaas,
        provincias,
        organos,
      };
    } catch (error) {
      this.logger.error('Critical error in getFilterOptions', error);
      return {
        estados: [],
        tipos: [],
        procedimientos: [],
        tramitaciones: [],
        ccaas: [],
        provincias: [],
        organos: [],
      };
    }
  }

  /**
   * Obtener los órganos de contratación más activos con conteo optimizado
   *
   * **Optimización:**
   * Usa 1 sola query con LEFT JOIN para obtener órganos y conteos simultáneamente
   * en lugar de 2 queries separadas. Mucho más eficiente en BD.
   *
   * **Degradación graceful:** Error → retorna array vacío
   *
   * @returns {Promise<Array>} Top 30 órganos ordenados por actividad (DESC)
   * @private Usado internamente por getFilterOptions()
   */
  private async getOrganosWithCounts() {
    try {
      // Query única con LEFT JOIN: obtiene órganos + conteo de licitaciones en 1 consulta
      const results = await this.orgRepo
        .createQueryBuilder('o')
        .select('o.id', 'id')
        .addSelect('o.nombre', 'nombre')
        .addSelect('o.ccaa', 'ccaa')
        .addSelect('o.provincia', 'provincia')
        .addSelect('COUNT(l.id)', 'totalLicitaciones')
        .leftJoin('licitaciones', 'l', 'l."organoId" = o.id')
        .where(`o.nombre != :excludeName`, {
          excludeName: ORGANOS_FILTER_CONFIG.EXCLUDE_NAME,
        })
        .groupBy('o.id')
        .addGroupBy('o.nombre')
        .addGroupBy('o.ccaa')
        .addGroupBy('o.provincia')
        .orderBy('COUNT(l.id)', 'DESC')
        .addOrderBy('o.nombre', 'ASC')
        .limit(ORGANOS_FILTER_CONFIG.RETURN_LIMIT)
        .getRawMany<{
          id: string;
          nombre: string;
          ccaa: string | null;
          provincia: string | null;
          totalLicitaciones: string | number;
        }>();

      return results.map((o) => ({
        id: o.id,
        nombre: o.nombre,
        ccaa: o.ccaa,
        provincia: o.provincia,
        totalLicitaciones: this.safeParseInt(o.totalLicitaciones, 0),
      }));
    } catch (error) {
      this.logger.warn('Error fetching órganos for filters', error);
      return [];
    }
  }

  /**
   * Filtrar valores contra una whitelist
   *
   * Excluye valores sucios (códigos inválidos, typos, enums no reconocidos).
   * Garantiza que solo se devuelvan valores conocidos y válidos.
   *
   * @param rows - Array de { value: string, count: number }
   * @param whitelist - Set<string> de valores permitidos
   * @returns Array filtrado solo con valores en la whitelist
   * @private Usado por getFilterOptions()
   */
  private applyWhitelist(
    rows: Array<{ value: string; count: number }>,
    whitelist: Set<string>,
  ): Array<{ value: string; count: number }> {
    return rows.filter((r) => whitelist.has(r.value));
  }

  /**
   * Consultar BD para obtener valores únicos y conteos por campo
   *
   * Ejecuta GROUP BY para poblar dropdowns de filtros de forma dinámica.
   * Maneja campos camelCase escapándolos con comillas.
   *
   * @param field - Nombre del campo en entidad Licitacion
   * @param order - Dirección: ASC (alfabético) o DESC (por conteo)
   * @returns {Promise<Array>} Array [{value: string, count: number}, ...]
   * @private Usado por getFilterOptions()
   */
  private async queryFilterByField(
    field: string,
    order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<Array<{ value: string; count: number }>> {
    const col = CAMEL_CASE_FIELDS.has(field) ? `"${field}"` : field;

    const rows = await this.licRepo
      .createQueryBuilder('l')
      .select(`l.${col}`, 'value')
      .addSelect('COUNT(*)', 'count')
      .where(`l.${col} IS NOT NULL`)
      .andWhere(`l.${col} != ''`)
      .groupBy(`l.${col}`)
      .orderBy(order === 'ASC' ? 'value' : 'count', order)
      .getRawMany<{ value: string; count: string }>();

    return rows.map((r) => ({
      value: r.value,
      count: this.safeParseInt(r.count, 0),
    }));
  }

  /**
   * Parse seguro de enteros desde strings de BD
   *
   * Valida que el resultado sea un número válido.
   * Si falla, retorna un valor default en lugar de NaN.
   *
   * @param value - String a parsear (típicamente desde BD)
   * @param defaultValue - Valor si el parse falla
   * @returns Número parseado o defaultValue
   * @private Usado en queryFilterByField y getOrganosWithCounts
   */
  private safeParseInt(value: string | number, defaultValue: number = 0): number {
    if (typeof value === 'number') return value;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
}