/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Formato estándar de response
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  path: string;
}

/**
 * Interceptor global que formatea todas las respuestas exitosas
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | StreamableFile
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse<T> | StreamableFile> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // Las descargas/streams binarios (PDF, etc.) NO se envuelven en el
        // envelope {success, data}: hay que dejar que NestJS las envíe como
        // binario. Si se envuelven, el cliente recibe un JSON con las tripas
        // del StreamableFile en vez del fichero.
        if (data instanceof StreamableFile) {
          return data;
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      })
    );
  }
}