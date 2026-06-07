import { Readable } from 'stream';

export interface SaveFileParams {
  buffer: Buffer;
  /** Nombre original, solo para derivar extensión/key legible. */
  originalName: string;
  mimeType: string;
  /** Namespace lógico, ej: `user/<uuid>`. El provider decide la ruta real. */
  scope: string;
}

export interface SavedFile {
  /** Clave opaca para recuperar/borrar después. Se guarda en BD. */
  key: string;
  sizeBytes: number;
}

export interface IStorageProvider {
  readonly providerName: string;
  save(params: SaveFileParams): Promise<SavedFile>;
  getStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/** Token de inyección (interfaces no existen en runtime → Symbol). */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');