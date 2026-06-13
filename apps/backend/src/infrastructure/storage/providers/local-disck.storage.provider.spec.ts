import { LocalDiskStorageProvider } from './local-disk.storage.provider';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';

const readAll = (s: Readable) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    s.on('data', (c) => chunks.push(c as Buffer));
    s.on('end', () => resolve(Buffer.concat(chunks)));
    s.on('error', reject);
  });

describe('LocalDiskStorageProvider', () => {
  let dir: string;
  let provider: LocalDiskStorageProvider;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'vault-test-'));
    process.env.UPLOAD_DIR = dir; // el provider lee UPLOAD_DIR en el constructor
    provider = new LocalDiskStorageProvider();
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('guarda y recupera un fichero', async () => {
    const buffer = Buffer.from('hola mundo');
    const saved = await provider.save({
      buffer, originalName: 'a.txt', mimeType: 'text/plain', scope: 'user/123',
    });
    expect(saved.sizeBytes).toBe(buffer.byteLength);
    expect(await provider.exists(saved.key)).toBe(true);
    const stream = await provider.getStream(saved.key);
    expect((await readAll(stream)).toString()).toBe('hola mundo');
  });

  it('borra un fichero', async () => {
    const saved = await provider.save({
      buffer: Buffer.from('x'), originalName: 'b.txt', mimeType: 'text/plain', scope: 'user/123',
    });
    await provider.delete(saved.key);
    expect(await provider.exists(saved.key)).toBe(false);
  });

  it('rechaza intentos de path traversal', async () => {
    await expect(provider.getStream('../../etc/passwd')).rejects.toThrow();
  });
});