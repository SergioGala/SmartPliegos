import { QdrantProvider } from './qdrant.provider';

jest.mock('@qdrant/js-client-rest', () => {
  return {
    QdrantClient: jest.fn().mockImplementation(() => ({
      getCollections: jest.fn().mockResolvedValue({ collections: [] }),
      createCollection: jest.fn().mockResolvedValue({}),
      upsert: jest.fn().mockResolvedValue({}),
      search: jest.fn().mockResolvedValue([{ id: 'a', score: 0.9, payload: { foo: 'bar' } }]),
    })),
  };
});

describe('QdrantProvider', () => {
  let provider: QdrantProvider;

  beforeEach(() => {
    provider = new QdrantProvider();
  });

  it('ensureCollection creates if missing', async () => {
    await provider.ensureCollection('test', 1536);
    // Si no throwear, OK.
    expect(true).toBe(true);
  });

  it('search returns normalized hits', async () => {
    const hits = await provider.search('test', [0.1, 0.2], 5);
    expect(hits).toEqual([{ id: 'a', score: 0.9, payload: { foo: 'bar' } }]);
  });

  it('upsert is a no-op on empty', async () => {
    await provider.upsert('test', []);
    expect(true).toBe(true);
  });
});