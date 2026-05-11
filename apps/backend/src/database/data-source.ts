import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Cargar variables de entorno antes de construir el DataSource.
// La CLI de TypeORM no pasa por NestJS, así que tenemos que hacerlo a mano.
dotenv.config();

/**
 * DataSource usado EXCLUSIVAMENTE por TypeORM CLI.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Las entities están dispersas en módulos. Glob match recursivo.
  entities: ['src/**/*.entity.ts'],

  // Migrations en una carpeta dedicada con timestamp prefix
  migrations: ['src/database/migrations/*.ts'],

  // NUNCA true. Las migrations son la fuente de verdad del schema.
  synchronize: false,

  // En dev queremos ver el SQL que se ejecuta. En prod desactivar.
  logging: process.env.NODE_ENV === 'development',
});
