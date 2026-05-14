import { z } from 'zod';
import i18n from './config';

/**
 * Mapa global de errores de Zod → traducciones.
 *
 * Se aplica a TODAS las validaciones del proyecto que no especifiquen
 * mensaje custom. Los mensajes custom en schemas (ej: `.min(2, 'Mínimo 2')`)
 * SÍ se respetan y no pasan por este map.
 *
 * Uso: llamar `setupZodErrors()` en main.tsx al arrancar la app.
 *
 * En Zod v4 la API cambió:
 * - z.setErrorMap → z.config({ customError })
 * - ZodIssueCode.invalid_string → invalid_format
 * - issue.received, issue.type, issue.validation cambiaron de shape
 */
export function setupZodErrors() {
  const t = i18n.t.bind(i18n);

  z.config({
    customError: (issue) => {
      switch (issue.code) {
        case 'invalid_type': {
          // En v4, cuando un campo requerido falta, el code es 'invalid_type'
          // con input undefined/null.
          if (issue.input === undefined || issue.input === null) {
            return t('common:validation.required');
          }
          break;
        }

        case 'too_small': {
          // Solo procesamos strings; números y arrays heredan defaultError.
          if (issue.origin === 'string') {
            const min = Number(issue.minimum);
            if (min === 1) {
              return t('common:validation.required');
            }
            return t('common:validation.tooShort', { min });
          }
          break;
        }

        case 'too_big': {
          if (issue.origin === 'string') {
            const max = Number(issue.maximum);
            return t('common:validation.tooLong', { max });
          }
          break;
        }

        case 'invalid_format': {
          // En v4 los errores de email/url/regex/etc son 'invalid_format'
          // y traen un campo `format` que indica cuál.
          if ((issue as { format?: string }).format === 'email') {
            return t('common:validation.invalidEmail');
          }
          break;
        }
      }

      // Si no hemos manejado el caso, devolver undefined hace que Zod use
      // su mensaje por defecto (en inglés).
      return undefined;
    },
  });
}