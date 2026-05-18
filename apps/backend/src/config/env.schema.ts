/**
 * Schema de validación de variables de entorno.
 *
 * NOTA TEMPORAL: este archivo usa validación manual con tipos TypeScript.
 * En Sprint 1.4 se migrará a Zod (junto con el resto de DTOs del backend).
 * Cuando se haga, este archivo se reescribe pero el comportamiento al
 * arrancar es idéntico: si falta algo crítico, el backend NO arranca.
 *
 * Variables marcadas como `required: true` son críticas. Si falta una de
 * esas, validateEnv() lanza error y NestJS aborta el bootstrap.
 *
 * Variables `required: false` son opcionales (con default si se define).
 */

/**
 * Especificación de UNA variable de entorno.
 * El array ENV_SPEC debajo es una lista de estas.
 */
interface EnvVarSpec {
  /** Nombre de la variable, tal cual aparece en .env y process.env. */
  name: string;
  /** Si es true, la variable debe estar definida y no vacía. */
  required: boolean;
  /** Valor por defecto si no está definida (solo aplica si required=false). */
  default?: string;
  /**
   * Lista de valores que NO son aceptables para esta variable.
   * Uso típico: rechazar placeholders peligrosos como
   * 'change-me-in-production' o 'REEMPLAZA_ESTO'.
   */
  forbiddenValues?: string[];
  /**
   * Validador adicional. Recibe el valor y devuelve:
   *   - null si el valor es válido.
   *   - string con mensaje de error si es inválido.
   * Uso típico: longitud mínima, regex, prefijo esperado.
   */
  validate?: (value: string) => string | null;
}

/**
 * Especificación de TODAS las variables que SmartPliegos lee.
 *
 * Si añades una variable nueva al backend, AÑÁDELA AQUÍ.
 * Si no, validateEnv() no la valida y puede pasar undefined a tu código.
 */
export const ENV_SPEC: EnvVarSpec[] = [
  // ─── Application ───
  { name: 'NODE_ENV', required: false, default: 'development' },
  { name: 'APP_PORT', required: false, default: '3000' },
  { name: 'APP_NAME', required: false, default: 'smartpliegos' },
  { name: 'APP_URL', required: false, default: 'http://localhost:3000' },

  // ─── Database (PostgreSQL) ───
  { name: 'DB_HOST', required: true },
  { name: 'DB_PORT', required: false, default: '5432' },
  { name: 'DB_USERNAME', required: true },
  { name: 'DB_PASSWORD', required: true },
  { name: 'DB_NAME', required: true },

  // ─── JWT ───
  {
    name: 'JWT_SECRET',
    required: true,
    forbiddenValues: [
      'REEMPLAZA_ESTO_CON_UN_SECRET_DE_AL_MENOS_32_CARACTERES_ALEATORIOS',
      'default-secret-change-in-production',
      'secret',
      'changeme',
      'mySecret',
      'jwtSecret',
    ],
    validate: (value) =>
      value.length < 32
        ? `must be at least 32 characters (got ${value.length})`
        : null,
  },
  { name: 'JWT_EXPIRATION', required: false, default: '3600' },

  // ─── API ───
  { name: 'API_VERSION', required: false, default: 'v1' },
  { name: 'API_PREFIX', required: false, default: 'api' },

  // ─── Frontend / CORS ───
  { name: 'FRONTEND_URL', required: false, default: 'http://localhost:5173' },
  { name: 'CORS_ORIGIN', required: false, default: 'http://localhost:5173' },

  // ─── Resend ───
  {
    name: 'RESEND_API_KEY',
    required: true,
    validate: (value) =>
      value.startsWith('re_') ? null : 'must start with "re_"',
  },
  {
    name: 'RESEND_FROM_EMAIL',
    required: false,
    default: 'onboarding@resend.dev',
  },

  // ─── Google OAuth ───
  // Marcadas como NO requeridas porque OAuth puede estar desactivado en
  // algunos entornos (ej. tests). El AuthModule fallará explícitamente
  // si se invoca el endpoint de Google sin estas variables, lo cual es
  // comportamiento aceptable.
  { name: 'GOOGLE_CLIENT_ID', required: false },
  { name: 'GOOGLE_CLIENT_SECRET', required: false },
  {
    name: 'GOOGLE_CALLBACK_URL',
    required: false,
    default: 'http://localhost:3000/api/v1/auth/google/callback',
  },

  // ─── Redis ───
  { name: 'REDIS_URL', required: false, default: 'redis://localhost:6379' },
  { name: 'REDIS_HOST', required: false, default: 'localhost' },
  { name: 'REDIS_PORT', required: false, default: '6379' },
  { name: 'REDIS_PASSWORD', required: false, default: '' },
   
  // ─── Sentry ───
  { name: 'SENTRY_DSN', required: false },

  // ─── File upload ───
  { name: 'MAX_FILE_SIZE', required: false, default: '5242880' },
  { name: 'UPLOAD_DIR', required: false, default: './uploads' },

   // ─── Logging ───
  {
    name: 'LOG_FORMAT',
    required: false,
    default: 'pretty',
    validate: (value) =>
      ['json', 'pretty'].includes(value)
        ? null
        : `must be 'json' or 'pretty' (got '${value}')`,
  },

  { name: 'LOG_LEVEL', required: false, default: 'info' },

   // ─── Email provider ───
  {
    name: 'MAIL_PROVIDER_TYPE',
    required: false,
    default: 'resend',
    validate: (value) =>
      ['resend', 'memory'].includes(value)
        ? null
        : `must be 'resend' or 'memory' (got '${value}')`,
  },
];

/**
 * Valida process.env contra ENV_SPEC.
 *
 * Comportamiento:
 *   - Aplica defaults a las opcionales que no estén definidas.
 *   - Valida que las requeridas existan y no sean strings vacíos.
 *   - Valida que las requeridas no contengan placeholders peligrosos.
 *   - Aplica validadores adicionales (longitud, regex).
 *
 * Si todo OK, retorna void.
 * Si algo falla, lanza Error con un mensaje detallado de TODAS las
 * variables que están mal (no solo la primera). Esto es importante:
 * el dev ve TODOS sus problemas de configuración en un solo error,
 * no uno detrás de otro.
 *
 * Esta función debe llamarse al inicio del proceso, antes de que
 * cualquier módulo de NestJS lea variables.
 */
export function validateEnv(env: NodeJS.ProcessEnv): void {
  const errors: string[] = [];

  for (const spec of ENV_SPEC) {
    const rawValue = env[spec.name];

    // Caso 1: variable no definida o vacía
    if (rawValue === undefined || rawValue === '') {
      if (spec.required) {
        errors.push(`  ✗ ${spec.name} is REQUIRED but missing or empty`);
        continue;
      }
      // Si es opcional con default, lo aplicamos al process.env
      if (spec.default !== undefined) {
        env[spec.name] = spec.default;
      }
      continue;
    }

    // Caso 2: variable tiene valor pero está en la lista de prohibidos
    if (spec.forbiddenValues?.includes(rawValue)) {
      errors.push(
        `  ✗ ${spec.name} has a forbidden placeholder value: "${rawValue}". Generate a real value.`,
      );
      continue;
    }

    // Caso 3: validador adicional (longitud, prefijo, regex)
    if (spec.validate) {
      const validationError = spec.validate(rawValue);
      if (validationError) {
        errors.push(`  ✗ ${spec.name}: ${validationError}`);
      }
    }
  }

  // Si hay errores, lanzar todos juntos en un mensaje legible
  if (errors.length > 0) {
    const message = [
      '',
      '════════════════════════════════════════════════════════════════',
      '  Environment validation FAILED',
      '════════════════════════════════════════════════════════════════',
      ...errors,
      '',
      'Fix the above issues in your .env file and restart.',
      'See .env.example for reference.',
      '════════════════════════════════════════════════════════════════',
      '',
    ].join('\n');

    throw new Error(message);
  }
}