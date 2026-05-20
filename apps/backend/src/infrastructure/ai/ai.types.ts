export interface LLMCompletionRequest {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMCompletionResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface ILLMProvider {
  readonly name: 'anthropic' | 'openai';
  readonly isConfigured: boolean;
  complete(req: LLMCompletionRequest): Promise<LLMCompletionResult>;
  ping(): Promise<boolean>;
}

export interface IEmbeddingsProvider {
  readonly name: 'openai';
  readonly isConfigured: boolean;
  readonly vectorSize: number;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  ping(): Promise<boolean>;
}

export interface VectorRecord {
  id: string;
  vector: number[];
  payload?: Record<string, unknown>;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  payload?: Record<string, unknown>;
}

export interface IVectorStore {
  readonly name: 'qdrant';
  readonly isConfigured: boolean;
  ensureCollection(name: string, vectorSize: number): Promise<void>;
  upsert(collection: string, records: VectorRecord[]): Promise<void>;
  search(collection: string, vector: number[], topK: number): Promise<VectorSearchResult[]>;
  ping(): Promise<boolean>;
}