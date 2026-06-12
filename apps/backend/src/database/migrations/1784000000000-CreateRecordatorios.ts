import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecordatorios1784000000000 implements MigrationInterface {
  name = 'CreateRecordatorios1784000000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "recordatorios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "licitacionId" uuid NOT NULL,
        "daysBefore" integer NOT NULL,
        "remindAt" TIMESTAMPTZ NOT NULL,
        "note" text,
        "status" varchar(16) NOT NULL DEFAULT 'PENDING',
        "sentAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_recordatorios" PRIMARY KEY ("id"),
        CONSTRAINT "uq_recordatorio_user_licitacion" UNIQUE ("userId","licitacionId"),
        CONSTRAINT "fk_recordatorio_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_recordatorio_licitacion" FOREIGN KEY ("licitacionId") REFERENCES "licitaciones"("id") ON DELETE CASCADE
      );
    `);
    await q.query(`CREATE INDEX "idx_recordatorio_user" ON "recordatorios" ("userId");`);
    await q.query(`CREATE INDEX "idx_recordatorio_due" ON "recordatorios" ("status","remindAt");`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "recordatorios";`);
  }
}