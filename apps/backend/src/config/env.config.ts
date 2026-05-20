import * as dotenv from 'dotenv';
import { envSchema, validateEnv } from './env.schema';

dotenv.config();
validateEnv(process.env);

const env = envSchema.parse(process.env); // ahora 100 % tipado

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.APP_PORT,
  appName: env.APP_NAME,
  appUrl: env.APP_URL,

  db: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    name: env.DB_NAME,
  },

  jwtSecret: env.JWT_SECRET,
  jwtExpiration: env.JWT_EXPIRATION,

  api: {
    version: env.API_VERSION,
    prefix: env.API_PREFIX,
  },

  corsOrigin: env.CORS_ORIGIN,
  frontendUrl: env.FRONTEND_URL,

  resend: {
    apiKey: env.RESEND_API_KEY,
    fromEmail: env.RESEND_FROM_EMAIL,
  },

  ai: {
  anthropic: {
    apiKey: env.ANTHROPIC_API_KEY ?? null,
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
  },
  openai: {
    apiKey: env.OPENAI_API_KEY ?? null,
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
  },
  qdrant: {
    url: env.QDRANT_URL,
    apiKey: env.QDRANT_API_KEY ?? null,
    collectionLicitaciones: env.QDRANT_COLLECTION_LICITACIONES,
  },
},

  logFormat: env.LOG_FORMAT,
  logLevel: env.LOG_LEVEL,
  mailProviderType: env.MAIL_PROVIDER_TYPE,
} as const;

export default config;