import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Crea (o promociona) el usuario SUPER_ADMIN `smartpliegos@gmail.com`
 * para poder ejecutar los endpoints protegidos de scraping histórico, etc.
 *
 * La contraseña NO se hardcodea: se lee de `process.env.SUPER_ADMIN_PASSWORD`
 * y se hashea en runtime con bcrypt (mismos SALT_ROUNDS=10 que la app), así
 * que el login normal (`bcrypt.compare`) la valida sin problema.
 *
 * Uso:
 *   SUPER_ADMIN_PASSWORD='unaPasswordFuerte' npm run migration:run
 *
 * Si la variable no está definida, usa un valor por defecto SOLO para dev y
 * avisa por consola — cámbialo cuanto antes.
 *
 * Idempotente: si el email ya existe, lo promociona a SUPER_ADMIN y lo
 * reactiva, sin tocar su contraseña.
 */
export class SeedSuperAdminUser1779477787601 implements MigrationInterface {
  private readonly EMAIL = 'smartpliegos@gmail.com';
  private readonly SALT_ROUNDS = 10;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const plainPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!plainPassword) {
      // eslint-disable-next-line no-console
      console.warn(
        '[SeedSuperAdminUser] SUPER_ADMIN_PASSWORD no definida. ' +
          'Usando contraseña por defecto "ChangeMe123!" — CÁMBIALA cuanto antes.',
      );
    }

    const passwordHash = await bcrypt.hash(
      plainPassword ?? 'ChangeMe123!',
      this.SALT_ROUNDS,
    );

    // INSERT idempotente: si el email ya existe, solo lo promociona.
    await queryRunner.query(
      `
      INSERT INTO "users" ("email", "firstName", "lastName", "password", "role", "isActive")
      VALUES ($1, $2, $3, $4, 'SUPER_ADMIN', true)
      ON CONFLICT ("email") DO UPDATE
        SET "role" = 'SUPER_ADMIN',
            "isActive" = true;
      `,
      [this.EMAIL, 'SmartPliegos', 'Admin', passwordHash],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1;`, [
      this.EMAIL,
    ]);
  }
}