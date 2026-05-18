import type { Request, Response } from 'express';
import morgan from 'morgan';
import { config } from './env.config';

morgan.token('request-id', (req: Request) => {
  return (req as Request & { requestId?: string }).requestId ?? '-';
});

const jsonFormat = (tokens: morgan.TokenIndexer<Request, Response>, req: Request, res: Response): string => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'http',
    service: config.appName,
    env: config.nodeEnv,
    requestId: tokens['request-id'](req, res),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number(tokens.status(req, res) ?? 0),
    responseTime: Number(tokens['response-time'](req, res) ?? 0),
    contentLength: tokens.res(req, res, 'content-length') ?? '0',
    userAgent: tokens['user-agent'](req, res) ?? '',
  });
};

const prettyFormat =
  ':request-id :method :url :status :response-time ms - :res[content-length]';

const useJson = config.logFormat === 'json' || config.nodeEnv === 'production';

const skip = (req: Request, res: Response): boolean => {
  if (
    req.url === '/health' ||
    req.url === '/healthz' ||
    req.url === '/health/live' ||
    req.url === '/health/ready'
  ) {
    return true;
  }
  if (config.nodeEnv === 'production' && res.statusCode < 400) {
    return true;
  }
  return false;
};

export const morganMiddleware = useJson
  ? morgan(jsonFormat, { skip })
  : morgan(prettyFormat, { skip });