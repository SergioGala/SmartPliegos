import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMembershipsAndAudit1786000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "organization_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "role" varchar NOT NULL DEFAULT 'MEMBER',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organization_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_org_members_org_user" UNIQUE ("organizationId", "userId"),
        CONSTRAINT "FK_org_members_org" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_org_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_org_members_org" ON "organization_members" ("organizationId")
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "actorUserId" uuid,
        "action" varchar NOT NULL,
        "targetType" varchar,
        "targetId" uuid,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_org" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_org_created" ON "audit_logs" ("organizationId", "createdAt" DESC)
    `);

    // Backfill: un membership por cada usuario que ya pertenece a una org.
    // ORG_OWNER -> OWNER, el resto -> MEMBER.
    await queryRunner.query(`
      INSERT INTO "organization_members" ("organizationId", "userId", "role")
      SELECT u."organizationId", u."id",
        CASE WHEN u."role" = 'ORG_OWNER' THEN 'OWNER' ELSE 'MEMBER' END
      FROM "users" u
      WHERE u."organizationId" IS NOT NULL
      ON CONFLICT ("organizationId", "userId") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "organization_members"`);
  }
}
