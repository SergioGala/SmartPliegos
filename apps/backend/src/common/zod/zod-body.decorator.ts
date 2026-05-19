import { Body, UsePipes, applyDecorators } from '@nestjs/common';
import type { ZodTypeAny } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

/**
 * Atajo: `@ZodBody(loginSchema)` en lugar de
 *   `@UsePipes(new ZodValidationPipe(loginSchema)) ...@Body() body: LoginDto`.
 *
 * Uso:
 *@Post('login')
 *   login(@ZodBody(loginSchema) dto: LoginDto) { ... }
 */
export function ZodBody<T extends ZodTypeAny>(schema: T): ParameterDecorator {
  return Body(new ZodValidationPipe(schema));
}

/**
 * Atajo para validar query parameters con Zod.
 */
export function ZodQuery<T extends ZodTypeAny>(schema: T): ParameterDecorator {
  // Importamos Query localmente para no contaminar el módulo si solo se usa Body.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Query } = require('@nestjs/common') as typeof import('@nestjs/common');
  return Query(new ZodValidationPipe(schema));
}

export { applyDecorators, UsePipes };