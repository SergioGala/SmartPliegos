import * as fs from 'fs';
import * as path from 'path';
import { BoeParserService } from './boe-parser.service';
import type { BoeSumarioResponse } from './boe.types';

describe('BoeParserService', () => {
  let parser: BoeParserService;
  let sumarioReal: BoeSumarioResponse;

  beforeAll(() => {
    parser = new BoeParserService();
    const fixturePath = path.join(__dirname, '__fixtures__/sumario-20260514.json');
    sumarioReal = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as BoeSumarioResponse;
  });

  it('returns [] when sumario has no diario', () => {
    const result = parser.parseSumario({
      data: {
        sumario: {
          metadatos: { publicacion: 'BOE', fecha_publicacion: '14/05/2026' },
          diario: [],
        },
      },
    });
    expect(result).toEqual([]);
  });

  it('returns [] when sumario is empty response', () => {
    expect(parser.parseSumario({})).toEqual([]);
  });

  it('extracts only section III disposiciones from real fixture', () => {
    const result = parser.parseSumario(sumarioReal);
    expect(Array.isArray(result)).toBe(true);
    result.forEach((d) => {
      expect(d.externalId).toMatch(/^BOE-[A-Z]-\d{4}-\d+/);
      expect(typeof d.titulo).toBe('string');
      expect(d.fechaPublicacion).toBeInstanceOf(Date);
    });
  });

  it('parses fecha_publicacion as Date UTC', () => {
    const result = parser.parseSumario({
      data: {
        sumario: {
          metadatos: { publicacion: 'BOE', fecha_publicacion: '14/05/2026' },
          diario: [
            {
              sumario_diario: { identificador: 'BOE-S-2026-117' },
              seccion: [
                {
                  codigo: '3',
                  nombre: 'III. Otras disposiciones',
                  departamento: [
                    {
                      codigo: 'X',
                      nombre: 'Test',
                      item: [{ identificador: 'BOE-A-2026-1', titulo: 'Una disposición', url_pdf: { texto: 'https://x/pdf' } }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].fechaPublicacion.toISOString()).toBe('2026-05-14T00:00:00.000Z');
  });

  it('extracts items from epigrafes within section III', () => {
    const result = parser.parseSumario({
      data: {
        sumario: {
          metadatos: { publicacion: 'BOE', fecha_publicacion: '14/05/2026' },
          diario: [
            {
              sumario_diario: { identificador: 'BOE-S-2026-117' },
              seccion: [
                {
                  codigo: '3',
                  nombre: 'III.',
                  departamento: [
                    {
                      codigo: 'X',
                      nombre: 'Test',
                      epigrafe: [
                        {
                          nombre: 'Subvenciones',
                          item: [{ identificador: 'BOE-A-2026-2', titulo: 'Subvención X' }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].epigrafeNombre).toBe('Subvenciones');
    expect(result[0].externalId).toBe('BOE-A-2026-2');
  });

  it('ignores sections other than III', () => {
    const result = parser.parseSumario({
      data: {
        sumario: {
          metadatos: { publicacion: 'BOE', fecha_publicacion: '14/05/2026' },
          diario: [
            {
              sumario_diario: { identificador: 'BOE-S-2026-117' },
              seccion: [
                { codigo: '1', nombre: 'I.', departamento: [{ codigo: 'A', nombre: 'Dep A', item: [{ identificador: 'BOE-A-2026-9', titulo: 'No' }] }] },
                { codigo: '2A', nombre: 'II A.', departamento: [] },
              ],
            },
          ],
        },
      },
    });
    expect(result).toEqual([]);
  });
});
