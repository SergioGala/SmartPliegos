import * as winston from 'winston';
import { utilities as nestUtils } from 'nest-winston';
import { requestContextStorage } from '../common/middleware';
import { config } from './env.config';

const SERVICE_NAME = config.appName;

/**
 * Format que inyecta requestId desde AsyncLocalStorage.
 * Si la log no viene de una request HTTP (ej. cron, bootstrap), requestId
 * sale como null.
 */
const injectRequestId = winston.format((info) => {
  const ctx = requestContextStorage.getStore();
  info.requestId = ctx?.requestId ?? null;
  return info;
});

const baseMetadata = winston.format((info) => {
  info.service = SERVICE_NAME;
  info.env = config.nodeEnv;
  return info;
});

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: () => new Date().toISOString() }),
  winston.format.errors({ stack: true }),
  injectRequestId(),
  baseMetadata(),
  winston.format.json(),
);

const prettyFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  injectRequestId(),
  winston.format.colorize({ all: false, level: true }),
  nestUtils.format.nestLike(SERVICE_NAME, {
    prettyPrint: true,
    colors: true,
  }),
);

const useJson = config.logFormat === 'json' || config.nodeEnv === 'production';

export const winstonConfig = {
  level: config.logLevel,
  transports: [
    new winston.transports.Console({
      format: useJson ? jsonFormat : prettyFormat,
    }),
  ],
};