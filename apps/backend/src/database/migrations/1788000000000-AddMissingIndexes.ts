import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingIndexes1788000000000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_users_organizationId" ON "users" ("organizationId")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_alerts_userId" ON "alerts" ("userId")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_alerts_cpvCodes" ON "alerts" USING gin ("cpvCodes")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_invitations_organizationId" ON "invitations" ("organizationId")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_invitations_email" ON "invitations" ("email")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_scraping_logs_createdAt" ON "scraping_logs" ("createdAt")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_scraping_logs_source" ON "scraping_logs" ("source")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS "IDX_users_organizationId"`);
    await q.query(`DROP INDEX IF EXISTS "IDX_alerts_userId"`);
    await q.query(`DROP INDEX IF EXISTS "IDX_alerts_cpvCodes"`);
    await q.query(`DROP INDEX IF EXISTS "IDX_invitations_organizationId"`);
    await q.query(`DROP INDEX IF EXISTS "IDX_invitations_email"`);
    await q.query(`DROP INDEX IF EXISTS "IDX_scraping_logs_createdAt"`);
    await q.query(`DROP INDEX IF EXISTS "IDX_scraping_logs_source"`);
  }
}
