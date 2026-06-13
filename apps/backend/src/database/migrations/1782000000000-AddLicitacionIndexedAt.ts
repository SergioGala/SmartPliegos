import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLicitacionIndexedAt1782000000000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "licitaciones" ADD COLUMN IF NOT EXISTS "indexedAt" TIMESTAMP`);

    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_licitaciones_pending_index"
       ON "licitaciones" ("updatedAt")
       WHERE "indexedAt" IS NULL OR "indexedAt" < "updatedAt"`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS "idx_licitaciones_pending_index"`);
    await q.query(`ALTER TABLE "licitaciones" DROP COLUMN IF EXISTS "indexedAt"`);
  }
}