import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAlertsTable1715432700002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        email VARCHAR(255),
        estados TEXT[] DEFAULT '{}',
        "tiposContrato" TEXT[] DEFAULT '{}',
        procedimientos TEXT[] DEFAULT '{}',
        tramitaciones TEXT[] DEFAULT '{}',
        ccaas TEXT[] DEFAULT '{}',
        provincias TEXT[] DEFAULT '{}',
        "cpvCodes" TEXT[] DEFAULT '{}',
        "importeMin" BIGINT,
        "importeMax" BIGINT,
        "palabrasClave" VARCHAR,
        "isActive" BOOLEAN DEFAULT true,
        "lastTriggeredAt" TIMESTAMPTZ,
        "triggerCount" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts("userId");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts("isActive");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS alerts CASCADE;`);
  }
}
