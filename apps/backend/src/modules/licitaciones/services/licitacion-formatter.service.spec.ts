import { LicitacionFormatterService } from './licitacion-formatter.service';
import type { Licitacion } from '../../scraping/shared/entities/licitacion.entity';

describe('LicitacionFormatterService', () => {
  const service = new LicitacionFormatterService();

  // ── safeDecimalToNumber ──────────────────────────────────────────────
  describe('safeDecimalToNumber', () => {
    it('devuelve null para null/undefined', () => {
      expect(service.safeDecimalToNumber(null)).toBeNull();
      expect(service.safeDecimalToNumber(undefined)).toBeNull();
    });

    it('usa toNumber() si es un Decimal de TypeORM', () => {
      expect(service.safeDecimalToNumber({ toNumber: () => 999.5 })).toBe(999.5);
    });

    it('convierte strings y números', () => {
      expect(service.safeDecimalToNumber('123.45')).toBe(123.45);
      expect(service.safeDecimalToNumber(100)).toBe(100);
    });

    it('devuelve null si el string no es numérico', () => {
      expect(service.safeDecimalToNumber('no-soy-un-numero')).toBeNull();
    });
  });

  // ── maskNif ──────────────────────────────────────────────────────────
  describe('maskNif', () => {
    it('devuelve undefined si no hay NIF', () => {
      expect(service.maskNif(undefined)).toBeUndefined();
      expect(service.maskNif('')).toBeUndefined();
    });

    it('devuelve *** si es demasiado corto (<6)', () => {
      expect(service.maskNif('12345')).toBe('***');
    });

    it('muestra los primeros 5 y oculta el resto', () => {
      expect(service.maskNif('12345678X')).toBe('12345****');
      expect(service.maskNif('123456')).toBe('12345*');
    });
  });

  // ── maskSensitiveData ────────────────────────────────────────────────
  describe('maskSensitiveData', () => {
    it('enmascara adjudicatarioNif si es string', () => {
      const out = service.maskSensitiveData({ adjudicatarioNif: '12345678X' });
      expect(out.adjudicatarioNif).toBe('12345****');
    });

    it('deja el objeto igual si no hay adjudicatarioNif', () => {
      const obj = { foo: 'bar' };
      expect(service.maskSensitiveData(obj)).toEqual({ foo: 'bar' });
    });

    it('no toca adjudicatarioNif si no es string', () => {
      const obj = { adjudicatarioNif: null };
      expect(service.maskSensitiveData(obj)).toEqual({ adjudicatarioNif: null });
    });
  });

  // ── formatList ───────────────────────────────────────────────────────
  describe('formatList', () => {
    const base = {
      id: 'lic-1',
      title: 'Obras varias',
      estado: 'PUB',
      tipoContrato: 'Obras',
      procedimiento: 'Abierto',
      presupuestoBase: '1000.50',
      presupuestoConIva: { toNumber: () => 1210.6 },
      cpvCodes: ['45000000'],
      ccaa: 'Madrid',
      provincia: 'Madrid',
      fechaPublicacion: new Date('2026-06-01'),
      fechaPresentacion: new Date('2026-07-01'),
      tieneLotes: false,
    };

    it('formatea con órgano', () => {
      const l = { ...base, organo: { id: 'o1', nombre: 'Ayto X' } } as unknown as Licitacion;
      const out = service.formatList(l);

      expect(out.presupuestoBase).toBe(1000.5); // string -> number
      expect(out.presupuestoConIva).toBe(1210.6); // decimal -> number
      expect(out.organo).toEqual({ id: 'o1', nombre: 'Ayto X' });
    });

    it('deja organo en null si no hay', () => {
      const l = { ...base, organo: null } as unknown as Licitacion;
      expect(service.formatList(l).organo).toBeNull();
    });
  });

  // ── formatDetail ─────────────────────────────────────────────────────
  describe('formatDetail', () => {
    const base = {
      id: 'lic-1',
      externalId: 'ext-1',
      source: 'PLACE',
      title: 'T',
      presupuestoBase: null,
      presupuestoConIva: null,
      importeAdjudicacion: '5000',
      adjudicatarioNombre: 'Empresa SL',
      adjudicatarioNif: '12345678X',
      cpvCodes: [],
      documentos: [],
      tieneLotes: false,
    };

    it('enmascara el NIF del adjudicatario', () => {
      const l = { ...base, organo: null } as unknown as Licitacion;
      const out = service.formatDetail(l);
      expect(out.adjudicatarioNif).toBe('12345****');
      expect(out.importeAdjudicacion).toBe(5000);
    });

    it('mapea el órgano extendido cuando existe', () => {
      const l = {
        ...base,
        organo: { id: 'o1', externalId: 'e1', nombre: 'Ayto', tipo: 'Local', ccaa: 'Madrid', web: 'x.es' },
      } as unknown as Licitacion;
      const out = service.formatDetail(l);
      expect(out.organo).toMatchObject({ id: 'o1', nombre: 'Ayto', web: 'x.es' });
    });
  });
});