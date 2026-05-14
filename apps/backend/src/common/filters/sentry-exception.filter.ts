import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

/**
 * Exception filter que reporta errores a Sentry.
 *
 * Ignora errores 4xx (las cosas tipo "validation failed", "not found",
 * "unauthorized" no son errores reales del sistema, son comportamiento
 * normal de la app).
 *
 * Captura errores 5xx (problemas reales del backend) Y errores no-HTTP
 * (excepciones inesperadas).
 */
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : 500;

    // Solo reportamos errores reales (5xx o no-HTTP)
    if (!isHttpException || status >= 500) {
      Sentry.captureException(exception);
    }

    // Delegar al manejo normal de NestJS para que la respuesta HTTP siga igual
    super.catch(exception, host);
  }
}