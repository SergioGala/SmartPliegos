import { z } from 'zod';

/**
 * Schema Zod de las variables de entorno.
 *
 * Reemplaza la validación manual del Sprint 1.4. Comportamiento idéntico:
 * si una required falla, lanzamos error agregado con todas las variables
 * inválidas — no una a una.
 */
const ForbiddenJwtSecrets = new Set([
  'REEMPLAZA_ESTO_CON_UN_SECRET_DE_AL_MENOS_32_CARACTERES_ALEATORIOS',
  'default-secret-change-in-production',
  'secret',
  'changeme',
  'mySecret',
  'jwtSecret',
]);

export const envSchema = z.object({
  // ─── Application ───
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_NAME: z.string().default('smartpliegos'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // ─── Database ───
  DB_HOST: z.string().min(1, 'DB_HOST is REQUIRED'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DB_USERNAME: z.string().min(1, 'DB_USERNAME is REQUIRED'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is REQUIRED'),
  DB_NAME: z.string().min(1, 'DB_NAME is REQUIRED'),

  // ─── JWT ───
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .refine(
      (v) => !ForbiddenJwtSecrets.has(v),
      'JWT_SECRET has a forbidden placeholder value; generate a real one',
    ),
  JWT_EXPIRATION: z.coerce.number().int().positive().default(3600),

  // ─── API ───
  API_VERSION: z.string().default('v1'),
  API_PREFIX: z.string().default('api'),

  // ─── Frontend / CORS ───
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // ─── Resend ───
  RESEND_API_KEY: z
    .string()
    .refine((v) => v.startsWith('re_'), 'RESEND_API_KEY must start with "re_"'),
  RESEND_FROM_EMAIL: z.string().email().default('onboarding@resend.dev'),

  // ─── Google OAuth (opcional) ───
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().default('http://localhost:3000/api/v1/auth/google/callback'),

  // ─── Redis ───
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().default(''),

  // ─── Sentry ───
  SENTRY_DSN: z.string().optional(),

  // ─── File upload ───
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(5_242_880),
  UPLOAD_DIR: z.string().default('./uploads'),

  // ─── Logging ───
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('pretty'),

  // ─── Email provider ───
  MAIL_PROVIDER_TYPE: z.enum(['resend', 'memory']).default('resend'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: NodeJS.ProcessEnv): void {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const lines = result.error.issues.map((issue) => {
      const path = issue.path.join('.') || '(root)';
      return `  ✗${path}:${issue.message}`;
    });
    const message = [
      '',
      '════════════════════════════════════════════════════════════════',
      '  Environment validation FAILED',
      '════════════════════════════════════════════════════════════════',
      ...lines,
      '',
      'Fix the above issues in your .env file and restart.',
      'See .env.example for reference.',
      '════════════════════════════════════════════════════════════════',
      '',
    ].join('\n');
    throw new Error(message);
  }

  // Aplicar defaults validados de vuelta a process.env para que código
  // que aún lee process.env directamente vea los defaults.
  for (const [key, value] of Object.entries(result.data)) {
    if (rawEnv[key] === undefined || rawEnv[key] === '') {
      rawEnv[key] = String(value);
    }
  }
}