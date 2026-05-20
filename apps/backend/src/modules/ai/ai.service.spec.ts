import { Test } from '@nestjs/testing';
import { AiService } from './ai.service';
import {
  LLM_PROVIDER,
  EMBEDDINGS_PROVIDER,
  VECTOR_STORE,
} from '../../infrastructure/ai';

describe('AiService', () => {
  let service: AiService;
  let llm: { isConfigured: boolean; complete: jest.Mock; ping: jest.Mock; name: string };
  let embeddings: { isConfigured: boolean; vectorSize: number; embed: jest.Mock; embedBatch: jest.Mock; ping: jest.Mock; name: string };
  let vectors: { isConfigured: boolean; upsert: jest.Mock; search: jest.Mock; ensureCollection: jest.Mock; ping: jest.Mock; name: string };

  beforeEach(async () => {
    llm = {
      isConfigured: true,
      name: 'anthropic',
      complete: jest.fn().mockResolvedValue({ text: 'summary', inputTokens: 10, outputTokens: 20, model: 'claude' }),
      ping: jest.fn().mockResolvedValue(true),
    };
    embeddings = {
      isConfigured: true,
      vectorSize: 1536,
      name: 'openai',
      embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      embedBatch: jest.fn().mockResolvedValue([[0.1], [0.2]]),
      ping: jest.fn().mockResolvedValue(true),
    };
    vectors = {
      isConfigured: true,
      name: 'qdrant',
      upsert: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue([{ id: 'a', score: 0.9 }]),
      ensureCollection: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue(true),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: LLM_PROVIDER, useValue: llm },
        { provide: EMBEDDINGS_PROVIDER, useValue: embeddings },
        { provide: VECTOR_STORE, useValue: vectors },
      ],
    }).compile();

    service = moduleRef.get(AiService);
  });

  it('complete delegates to LLM provider', async () => {
    await service.complete({ system: 's', user: 'u' });
    expect(llm.complete).toHaveBeenCalled();
  });

  it('embed delegates to embeddings provider', async () => {
    await service.embed('hello');
    expect(embeddings.embed).toHaveBeenCalledWith('hello');
  });

  it('upsertLicitacionVector targets licitaciones collection', async () => {
    await service.upsertLicitacionVector('id-1', [0.1], { source: 'test' });
    expect(vectors.upsert).toHaveBeenCalledWith('licitaciones', [
      { id: 'id-1', vector: [0.1], payload: { source: 'test' } },
    ]);
  });

  it('health reports ok when all providers ping ok', async () => {
    const h = await service.health();
    expect(h).toEqual({ anthropic: 'ok', openai: 'ok', qdrant: 'ok' });
  });

  it('health reports unconfigured when provider has no api key', async () => {
    llm.isConfigured = false;
    const h = await service.health();
    expect(h.anthropic).toBe('unconfigured');
  });

  it('health reports down when provider ping fails', async () => {
    vectors.ping = jest.fn().mockRejectedValue(new Error('connection refused'));
    const h = await service.health();
    expect(h.qdrant).toBe('down');
  });
});