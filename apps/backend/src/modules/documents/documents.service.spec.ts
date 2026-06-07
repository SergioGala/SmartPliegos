import {
  BadRequestException, NotFoundException, PayloadTooLargeException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';

const makeQb = (raw: unknown) => ({
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue(raw),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
});

describe('DocumentsService', () => {
  let service: DocumentsService;
  let repo: any;
  let storage: any;

  const file = (over: Record<string, unknown> = {}) => ({
    originalname: 'a.pdf', mimetype: 'application/pdf',
    buffer: Buffer.from('contenido'), size: 9, ...over,
  });

  beforeEach(() => {
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 'doc-1', ...x })),
      findOne: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      softRemove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(() => makeQb({ sum: '0' })),
    };
    storage = {
      save: jest.fn().mockResolvedValue({ key: 'user/u1/uuid.pdf', sizeBytes: 9 }),
      getStream: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn(),
    };
    service = new DocumentsService(repo, storage);
  });

  it('sube un PDF válido', async () => {
    const doc = await service.upload({ ownerUserId: 'u1', organizationId: null, file: file() as any });
    expect(storage.save).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(doc.id).toBe('doc-1');
  });

  it('rechaza un MIME no permitido', async () => {
    await expect(
      service.upload({ ownerUserId: 'u1', organizationId: null, file: file({ mimetype: 'application/x-msdownload' }) as any }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('rechaza si supera la cuota', async () => {
    repo.createQueryBuilder = jest.fn(() => makeQb({ sum: String(999_999_999_999) }));
    await expect(
      service.upload({ ownerUserId: 'u1', organizationId: null, file: file() as any }),
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