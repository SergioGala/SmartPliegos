import { MigrationInterface, QueryRunner }
from 'typeorm';
export class
CreatePliegoDocuments1787000000000
implements MigrationInterface {
  public async up(queryRunner:
QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "pliego_documents" (
        "id"            uuid      NOT NULL
DEFAULT uuid_generate_v4(),
        "licitacionId"  uuid      NOT NULL,
        "tipo"          varchar   NOT NULL
DEFAULT 'OTRO',
        "nombre"        varchar(500),
        "sourceUrl"     varchar(2000) NOT
NULL,
        "mimeType"      varchar(150),
        "sizeBytes"     bigint,
        "storageKey"    varchar(1000),
        "extractedText" text,
        "status"        varchar   NOT NULL
DEFAULT 'PENDING',
        "errorMessage"  varchar(500),
        "createdAt"     TIMESTAMP NOT NULL
DEFAULT now(),
        "updatedAt"     TIMESTAMP NOT NULL
DEFAULT now(),
        CONSTRAINT "PK_pliego_documents"
PRIMARY KEY ("id"),
        CONSTRAINT
"UQ_pliego_documents_source" UNIQUE
("licitacionId", "sourceUrl"),
        CONSTRAINT
"FK_pliego_documents_licitacion"
          FOREIGN KEY ("licitacionId")
REFERENCES "licitaciones"("id") ON DELETE
CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX
"IDX_pliego_documents_licitacion" ON
"pliego_documents" ("licitacionId")`,
    );
  }
  public async down(queryRunner:
QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE
"pliego_documents"`);
  }
}