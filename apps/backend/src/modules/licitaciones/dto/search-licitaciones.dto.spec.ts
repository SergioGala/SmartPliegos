import { searchLicitacionesSchema } from './search-licitaciones.dto';

describe('searchLicitacionesSchema', () => {

    // ─── Caso base ────────────────────────────────────────────────────────────

    it('acepta payload vacío (todos los campos son opcionales)', () => {
        const result = searchLicitacionesSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it('acepta payload completo y válido', () => {
        const result = searchLicitacionesSchema.safeParse({
            q: 'servicios limpieza',
            estado: 'ABIERTA,ADJUDICADA',
            page: '1',
            pageSize: '20',
            sortBy: 'fecha',
            sortOrder: 'ASC',
            fechaDesde: '2024-01-01',
            fechaHasta: '2024-12-31',
            soloConPlazo: 'true',
            importeMin: '1000',
            importeMax: '50000',
        });
        expect(result.success).toBe(true);
    });

    // ─── Paginación ───────────────────────────────────────────────────────────

    it('coerce page de string a número', () => {
        const result = searchLicitacionesSchema.safeParse({ page: '3' });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.page).toBe(3);
    });

    it('rechaza page menor que 1', () => {
        const result = searchLicitacionesSchema.safeParse({ page: '0' });
        expect(result.success).toBe(false);
    });

    it('rechaza page negativo', () => {
        const result = searchLicitacionesSchema.safeParse({ page: '-1' });
        expect(result.success).toBe(false);
    });

    it('rechaza pageSize mayor que 100', () => {
        const result = searchLicitacionesSchema.safeParse({ pageSize: '101' });
        expect(result.success).toBe(false);
    });

    it('acepta pageSize en el límite máximo (100)', () => {
        const result = searchLicitacionesSchema.safeParse({ pageSize: '100' });
        expect(result.success).toBe(true);
    });

    // ─── Ordenación ───────────────────────────────────────────────────────────

    it('acepta sortBy con valores válidos', () => {
        for (const val of ['fecha', 'importe', 'deadline'] as const) {
            const result = searchLicitacionesSchema.safeParse({ sortBy: val });
            expect(result.success).toBe(true);
        }
    });

    it('rechaza sortBy con valor no permitido', () => {
        const result = searchLicitacionesSchema.safeParse({ sortBy: 'date' });
        expect(result.success).toBe(false);
    });

    it('acepta sortOrder ASC y DESC (case-sensitive)', () => {
        expect(searchLicitacionesSchema.safeParse({ sortOrder: 'ASC' }).success).toBe(true);
        expect(searchLicitacionesSchema.safeParse({ sortOrder: 'DESC' }).success).toBe(true);
    });

    it('rechaza sortOrder en minúsculas', () => {
        expect(searchLicitacionesSchema.safeParse({ sortOrder: 'asc' }).success).toBe(false);
        expect(searchLicitacionesSchema.safeParse({ sortOrder: 'desc' }).success).toBe(false);
    });

    // ─── Comma-list parsing ───────────────────────────────────────────────────

    it('convierte string CSV en array para estado', () => {
        const result = searchLicitacionesSchema.safeParse({ estado: 'ABIERTA,ADJUDICADA,CERRADA' });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.estado).toEqual(['ABIERTA', 'ADJUDICADA', 'CERRADA']);
    });

    it('tolera espacios en el CSV', () => {
        const result = searchLicitacionesSchema.safeParse({ ccaa: ' Madrid , Cataluña ' });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.ccaa).toEqual(['Madrid', 'Cataluña']);
    });

    it('tolera array ya parseado en tipoContrato', () => {
        const result = searchLicitacionesSchema.safeParse({ tipoContrato: ['OBRAS', 'SERVICIOS'] });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.tipoContrato).toEqual(['OBRAS', 'SERVICIOS']);
    });

    it('trata campo vacío como undefined en multi-select', () => {
        const result = searchLicitacionesSchema.safeParse({ estado: '' });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.estado).toBeUndefined();
    });

    // ─── Importes ─────────────────────────────────────────────────────────────

    it('coerce importeMin de string a número entero', () => {
        const result = searchLicitacionesSchema.safeParse({ importeMin: '5000' });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.importeMin).toBe(5000);
    });

    it('rechaza importeMin negativo', () => {
        const result = searchLicitacionesSchema.safeParse({ importeMin: '-1' });
        expect(result.success).toBe(false);
    });

    // ─── Boolean soloConPlazo ─────────────────────────────────────────────────

    it('convierte string "true" a boolean true', () => {
        const result = searchLicitacionesSchema.safeParse({ soloConPlazo: 'true' });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.soloConPlazo).toBe(true);
    });

    it('convierte string "false" a boolean false', () => {
        const result = searchLicitacionesSchema.safeParse({ soloConPlazo: 'false' });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.soloConPlazo).toBe(false);
    });

    // ─── Fechas ───────────────────────────────────────────────────────────────

    it('acepta fechas en formato YYYY-MM-DD', () => {
        const result = searchLicitacionesSchema.safeParse({ fechaDesde: '2024-01-15' });
        expect(result.success).toBe(true);
    });

    it('rechaza fechas con formato incorrecto', () => {
        const result = searchLicitacionesSchema.safeParse({ fechaDesde: '15/01/2024' });
        expect(result.success).toBe(false);
    });

    // ─── organoId ─────────────────────────────────────────────────────────────

    it('rechaza organoId que no sea UUID', () => {
        const result = searchLicitacionesSchema.safeParse({ organoId: 'not-a-uuid' });
        expect(result.success).toBe(false);
    });

    it('acepta organoId UUID válido', () => {
        const result = searchLicitacionesSchema.safeParse({
            organoId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        });
        expect(result.success).toBe(true);
    });
});