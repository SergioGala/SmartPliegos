import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Configuración de TypeORM para el AppModule.
 *
 * IMPORTANTE: las variables de entorno se garantizan por validateEnv()
 * en env.schema.ts. Si llegan aquí, ya están validadas. NO añadir
 * fallbacks tipo `|| 'localhost'` o `|| '1234'`: si la validación
 * dice que la variable es obligatoria y aquí no está, queremos un
 * crash ruidoso, no un fallback silencioso a credenciales hardcoded.
 */
export const typeormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  logging: false,
};