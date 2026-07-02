import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { SearchQueryBuilderService } from './search-query-builder.service';
import { Licitacion } from '../../scraping/shared/entities/licitacion.entity';

function makeQB() {
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['leftJoinAndSelect', 'andWhere', 'where', 'orderBy']) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  return qb;
}

describe('SearchQueryBuilderService', () => {
  let service: SearchQueryBuilderService;
  let qb: ReturnType<typeof makeQB>;
  const licRepo = { createQueryBuilder: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    qb = makeQB();
    licRepo.createQueryBuilder.mockReturnValue(qb);

    const moduleRef = await Test.createTestingModule({
      providers: [
        SearchQueryBuilderService,
        { provide: getRepositoryToken(Licitacion), useValue: licRepo },
      ],
    }).compile();
    service = moduleRef.get(SearchQueryBuilderService);
  });

  it('en el constructor hace el leftJoinAndSelect del órgano', () => {
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('l.organo', 'o');
  });

  describe('addFullTextSearch', () => {
    it('añade el filtro tsquery con el término recortado', () => {
      service.addFullTextSearch('  obras  ');
      expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('plainto_tsquery'), {
        q: 'obras',
      });
    });

    it('no añade nada si el término está vacío', () => {
      service.addFullTextSearch('   ');
      expect(qb.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('filtros single-value', () => {
    it('addCpvFilter añade ANY(cpvCodes)', () => {
      service.addCpvFilter('45000000');
      expect(qb.andWhere).toHaveBeenCalledWith(':cpv = ANY(l.\"cpvCodes\")', { cpv: '45000000' });
    });

    it('addCpvFilter no hace nada sin cpv', () => {
      service.addCpvFilter(undefined);
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('addPriceRange añade min y max', () => {
      service.addPriceRange(100, 500);
      expect(qb.andWhere).toHaveBeenCalledTimes(2);
    });

    it('addPriceRange sin límites no añade nada', () => {
      service.addPriceRange();
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('addOpenDeadlineFilter(true) filtra por fecha futura', () => {
      service.addOpenDeadlineFilter(true);
      expect(qb.andWhere).toHaveBeenCalledWith('l.\"fechaPresentacion\" > NOW()');
    });

    it('addOpenDeadlineFilter(false) no añade nada', () => {
      service.addOpenDeadlineFilter(false);
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('addOrganoFilter filtra por organoId', () => {
      service.addOrganoFilter('o1');
      expect(qb.andWhere).toHaveBeenCalledWith('l.\"organoId\" = :orgId', { orgId: 'o1' });
    });
  });

  describe('applyOrderBy', () => {
    it('ordena por importe', () => {
      service.applyOrderBy('importe', 'ASC');
      expect(qb.orderBy).toHaveBeenCalledWith('l.presupuestoBase', 'ASC', 'NULLS LAST');
    });
    it('ordena por deadline (siempre ASC)', () => {
      service.applyOrderBy('deadline');
      expect(qb.orderBy).toHaveBeenCalledWith('l.fechaPresentacion', 'ASC', 'NULLS LAST');
    });
    it('por defecto ordena por fecha de publicación', () => {
      service.applyOrderBy();
      expect(qb.orderBy).toHaveBeenCalledWith('l.fechaPublicacion', 'DESC', 'NULLS LAST');
    });
  });

  describe('encadenado y build', () => {
    it('los filtros multi-select son encadenables (devuelven this)', () => {
      expect(service.addStateFilter()).toBe(service);
      expect(service.addTypeFilter()).toBe(service);
      expect(service.addLocationFilters()).toBe(service);
    });

    it('build devuelve el qb y resetea para la siguiente búsqueda', () => {
      const built = service.build();
      expect(built).toBe(qb);
      // reset -> se vuelve a crear el query builder
      expect(licRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
    });
  });
});