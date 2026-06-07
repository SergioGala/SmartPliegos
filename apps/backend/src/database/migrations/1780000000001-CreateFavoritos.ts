import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFavoritos1780000000001 implements MigrationInterface {
  name = 'CreateFavoritos1780000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "favoritos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "licitacionId" uuid NOT NULL,
        "nota" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_favoritos" PRIMARY KEY ("id"),
        CONSTRAINT "uq_favorito_user_licitacion" UNIQUE ("userId","licitacionId"),
        CONSTRAINT "fk_favorito_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_favorito_licitacion" FOREIGN KEY ("licitacionId") REFERENCES "licitaciones"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_favorito_user" ON "favoritos" ("userId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "favoritos";`);
  }
}