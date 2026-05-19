import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * AsyncLocalStorage para propagar requestId a cualquier logger
 * que se invoque durante el ciclo de vida de una request.
 *
 * El logger Winston lo lee en su formato (ver winston-nest.config.ts).
 */
export const requestContextStorage = new AsyncLocalStorage<{ requestId: string }>();

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.header('x-request-id');
    const requestId = incoming && incoming.length > 0 ? incoming : randomUUID();

    // Lo exponemos en req para que controllers/services puedan leerlo
    (req as Request & { requestId: string }).requestId = requestId;

    // Lo devolvemos en la respuesta para que el cliente correlacione
    res.setHeader('X-Request-Id', requestId);

    // Lo ponemos en AsyncLocalStorage para que el logger lo pille sin tener req
    requestContextStorage.run({ requestId }, () => next());
  }
}