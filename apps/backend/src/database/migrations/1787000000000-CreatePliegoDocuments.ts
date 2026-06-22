import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePliegoDocuments1787000000000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE IF NOT EXISTS "pliego_documents" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "licitacionId"  uuid NOT NULL,
        "tipo"          varchar NOT NULL DEFAULT 'OTRO',
        "nombre"        varchar(500),
        "sourceUrl"     varchar(2000) NOT NULL,
        "mimeType"      varchar(150),
        "sizeBytes"     bigint,
        "storageKey"    varchar(1000),
        "extractedText" text,
        "status"        varchar NOT NULL DEFAULT 'PENDING',
        "errorMessage"  varchar(500),
        "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_pliego_documents_source" UNIQUE ("licitacionId", "sourceUrl"),
        CONSTRAINT "FK_pliego_documents_licitacion"
          FOREIGN KEY ("licitacionId") REFERENCES "licitaciones"("id") ON DELETE CASCADE
      )`);

    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_pliego_documents_licitacion" ON "pliego_documents" ("licitacionId")`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS "pliego_documents"`);
  }
}
