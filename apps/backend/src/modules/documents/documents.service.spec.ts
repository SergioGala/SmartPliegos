import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentEntity } from './document.entity';
import { STORAGE_PROVIDER } from '../../infrastructure/storage';

interface QbMock {
  select: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getRawOne: jest.Mock;
  getManyAndCount: jest.Mock;
}

/** QueryBuilder mock: los métodos encadenables devuelven el propio qb. */
function makeQb(sum: string): QbMock {
  const qb: QbMock = {
    select: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getRawOne: jest.fn().mockResolvedValue({ sum }),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  qb.select.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.skip.mockReturnValue(qb);
  qb.take.mockReturnValue(qb);
  return qb;
}

describe('DocumentsService', () => {
  let service: DocumentsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    count: jest.Mock;
    softRemove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let storage: {
    providerName: string;
    save: jest.Mock;
    getStream: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
  };

  const fileInput = (
    over: Partial<{ originalname: string; mimetype: string; buffer: Buffer; size: number }> = {},
  ) => ({
    originalname: 'a.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('contenido'),
    size: 9,
    ...over,
  });

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((d: Partial<DocumentEntity>) => d),
      save: jest.fn().mockResolvedValue({ id: 'doc-1' } as DocumentEntity),
      findOne: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      softRemove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue(makeQb('0')),
    };
    storage = {
      providerName: 'mock',
      save: jest.fn().mockResolvedValue({ key: 'user/u1/uuid.pdf', sizeBytes: 9 }),
      getStream: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: getRepositoryToken(DocumentEntity), useValue: repo },
        { provide: STORAGE_PROVIDER, useValue: storage },
      ],
    }).compile();

    service = moduleRef.get(DocumentsService);
  });

  it('sube un PDF válido', async () => {
    const doc = await service.upload({ ownerUserId: 'u1', organizationId: null, file: fileInput() });
    expect(storage.save).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(doc).toEqual({ id: 'doc-1' });
  });

  it('rechaza un MIME no permitido', async () => {
    await expect(
      service.upload({
        ownerUserId: 'u1',
        organizationId: null,
        file: fileInput({ mimetype: 'application/x-msdownload' }),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('rechaza si supera la cuota', async () => {
    repo.createQueryBuilder.mockReturnValue(makeQb(String(999_999_999_999)));
    await expect(
      service.upload({ ownerUserId: 'u1', organizationId: null, file: fileInput() }),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
  });

  it('getOwned lanza 404 si el documento no es del usuario', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.getOwned('doc-x', 'u1')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'doc-x', ownerUserId: 'u1' } });
  });

  it('remove borra los bytes y hace soft delete', async () => {
    repo.findOne.mockResolvedValue({ id: 'doc-1', ownerUserId: 'u1', storageKey: 'user/u1/uuid.pdf' });
    await service.remove('doc-1', 'u1');
    expect(storage.delete).toHaveBeenCalledWith('user/u1/uuid.pdf');
    expect(repo.softRemove).toHaveBeenCalled();
  });
});