import { Test } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { DataSource } from 'typeorm';
import { BoeScraperService } from './boe-scraper.service';
import { BoeParserService } from './boe-parser.service';
import { Licitacion } from '../shared/entities/licitacion.entity';
import { ScrapingLog } from '../shared/entities/scraping-log.entity';

describe('BoeScraperService', () => {
  let scraper: BoeScraperService;
  let httpGet: jest.Mock;
  let licRepo: { findOneBy: jest.Mock; update: jest.Mock; save: jest.Mock; create: jest.Mock };
  let logRepo: { save: jest.Mock; update: jest.Mock; create: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    httpGet = jest.fn();

    licRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'uuid-1', ...entity })),
      create: jest.fn().mockImplementation(() => ({} as Partial<Licitacion>)),
    };

    logRepo = {
      save: jest.fn().mockImplementation((log) => Promise.resolve({ id: 'log-uuid', ...log })),
      update: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockImplementation((entity: Partial<ScrapingLog>) => entity),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb: (m: unknown) => Promise<void>) => {
        await cb({ getRepository: () => licRepo });
      }),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        BoeScraperService,
        BoeParserService,
        { provide: getRepositoryToken(Licitacion), useValue: licRepo },
        { provide: getRepositoryToken(ScrapingLog), useValue: logRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    })
      .overrideProvider(HttpService)
      .useValue({ get: httpGet })
      .compile();

    scraper = moduleRef.get(BoeScraperService);
  });

  it('returns empty result when sumario returns 404', async () => {
    httpGet.mockReturnValue(
      throwError(() => new AxiosError('Not Found', '404', undefined, undefined, { status: 404 } as AxiosResponse)),
    );

    const result = await scraper.scrapeDay(new Date('2026-05-14T00:00:00Z'));
    expect(result.newItems).toBe(0);
    expect(result.updatedItems).toBe(0);
    expect(result.errors).toBe(0);
    expect(licRepo.save).not.toHaveBeenCalled();
    expect(logRepo.update).toHaveBeenCalledWith('log-uuid', expect.objectContaining({ status: 'SUCCESS' }));
  });

  it('inserts new disposiciones for section III', async () => {
    httpGet.mockReturnValue(
      of({
        data: {
          data: {
            sumario: {
              metadatos: { publicacion: 'BOE', fecha_publicacion: '14/05/2026' },
              diario: [
                {
                  sumario_diario: { identificador: 'BOE-S-2026-117' },
                  seccion: [
                    {
                      codigo: '3',
                      nombre: 'III',
                      departamento: [
                        {
                          codigo: 'X',
                          nombre: 'Test',
                          item: [
                            { identificador: 'BOE-A-2026-1', titulo: 'Una', url_pdf: { texto: 'https://x/1' } },
                            { identificador: 'BOE-A-2026-2', titulo: 'Otra', url_pdf: { texto: 'https://x/2' } },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        } as AxiosResponse,
      }),
    );

    const result = await scraper.scrapeDay(new Date('2026-05-14T00:00:00Z'));
    expect(result.newItems).toBe(2);
    expect(licRepo.save).toHaveBeenCalledTimes(2);
  });

  it('updates when externalId already exists', async () => {
    licRepo.findOneBy.mockResolvedValue({ id: 'existing-id', externalId: 'BOE-A-2026-1', source: 'BOE' });
    httpGet.mockReturnValue(
      of({
        data: {
          data: {
            sumario: {
              metadatos: { publicacion: 'BOE', fecha_publicacion: '14/05/2026' },
              diario: [
                {
                  sumario_diario: { identificador: 'BOE-S-2026-117' },
                  seccion: [
                    {
                      codigo: '3',
                      nombre: 'III',
                      departamento: [
                        { codigo: 'X', nombre: 'Test', item: [{ identificador: 'BOE-A-2026-1', titulo: 'Una', url_pdf: { texto: 'https://x' } }] },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        } as AxiosResponse,
      }),
    );

    const result = await scraper.scrapeDay(new Date('2026-05-14T00:00:00Z'));
    expect(result.newItems).toBe(0);
    expect(result.updatedItems).toBe(1);
   expect(licRepo.save).toHaveBeenCalledWith(
  expect.objectContaining({ id: 'existing-id', title: 'Una' }),
);
  });

  it('logs FAILED status when HTTP throws non-404 error', async () => {
    httpGet.mockReturnValue(throwError(() => new Error('network down')));

    await expect(scraper.scrapeDay(new Date('2026-05-14T00:00:00Z'))).rejects.toThrow('network down');
    expect(logRepo.update).toHaveBeenCalledWith('log-uuid', expect.objectContaining({ status: 'FAILED' }));
  });
});
