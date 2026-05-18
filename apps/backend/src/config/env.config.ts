import * as dotenv from 'dotenv';
import { validateEnv } from './env.schema';

// Cargar el .env primero (puebla process.env con las variables del archivo).
// Si .env no existe, dotenv no falla; simplemente no añade nada.
dotenv.config();

// Validar antes de exportar nada.
// Si algo falla, validateEnv lanza Error y NestJS aborta el bootstrap.
// Esto es el FAIL-FAST del que hablamos.
validateEnv(process.env);

/**
 * Configuración tipada del backend.
 *
 * Todos los valores aquí están GARANTIZADOS por validateEnv:
 * - Las marcadas como required:true en ENV_SPEC tienen valor.
 * - Las opcionales tienen su default aplicado a process.env.
 *
 * Por eso usamos `process.env.X!` (non-null assertion) en las requeridas:
 * sabemos que validateEnv ya verificó que existen.
 */
export const config = {
  // Application
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.APP_PORT ?? '3000', 10),
  appName: process.env.APP_NAME ?? 'smartpliegos',
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',

  // Database
  db: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
  },

  // JWT — sin fallback peligroso.
  // Si llega aquí es porque validateEnv ya garantizó que JWT_SECRET
  // existe y es seguro 
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiration: parseInt(process.env.JWT_EXPIRATION ?? '3600', 10),

  // API
  api: {
    version: process.env.API_VERSION ?? 'v1',
    prefix: process.env.API_PREFIX ?? 'api',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',

  logFormat: process.env.LOG_FORMAT ?? 'pretty',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  mailProviderType: (process.env.MAIL_PROVIDER_TYPE ?? 'resend') as 'resend' | 'memory',

  // Resend
  resend: {
    apiKey: process.env.RESEND_API_KEY!,
    fromEmail: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
  },
} as const;

export default config;