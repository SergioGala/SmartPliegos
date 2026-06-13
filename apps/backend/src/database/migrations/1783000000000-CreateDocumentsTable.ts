import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentsTable1783000000000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "ownerUserId" uuid NOT NULL,
        "organizationId" uuid,
        "filename" varchar(500) NOT NULL,
        "mimeType" varchar(150) NOT NULL,
        "sizeBytes" bigint NOT NULL,
        "storageKey" varchar(1000) NOT NULL UNIQUE,
        "checksum" varchar(64),
        "folder" varchar(120),
        "licitacionId" uuid,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ
      )`);
    await q.query(`CREATE INDEX IF NOT EXISTS "idx_documents_owner" ON "documents" ("ownerUserId")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "idx_documents_org" ON "documents" ("organizationId")`);
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS "documents"`);
  }
}