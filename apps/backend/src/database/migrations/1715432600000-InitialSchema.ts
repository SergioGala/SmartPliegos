import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1715432600000 implements MigrationInterface {
    name = 'InitialSchema1715432600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."organizations_plan_enum" AS ENUM('FREE', 'PRO', 'ADVANCED', 'STARTER', 'PROFESSIONAL')`);
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "plan" "public"."organizations_plan_enum" NOT NULL DEFAULT 'FREE', "logo" character varying(255), "website" character varying(255), "phone" character varying(20), "cif" character varying(15), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f68831cc260701c7b5a69053d49" UNIQUE ("cif"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_timezone_enum" AS ENUM('America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Mexico_City', 'America/Argentina/Buenos_Aires', 'America/Sao_Paulo', 'Europe/London', 'Europe/Madrid', 'Europe/Paris', 'Europe/Berlin', 'Europe/Lisbon', 'Europe/Amsterdam', 'Europe/Rome', 'Europe/Zurich', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Australia/Sydney', 'Australia/Melbourne', 'UTC')`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'ORG_OWNER', 'ORG_MEMBER', 'PUBLIC_USER')`);
        await queryRunner.query(`CREATE TYPE "public"."users_userplan_enum" AS ENUM('FREE', 'PRO', 'ADVANCED', 'STARTER', 'PROFESSIONAL')`);
        // Note: removed google_id as it is added by a separate migration
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "firstName" character varying(255) NOT NULL, "lastName" character varying(255) NOT NULL, "phone" character varying(20), "timezone" "public"."users_timezone_enum" NOT NULL DEFAULT 'UTC', "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'PUBLIC_USER', "userPlan" "public"."users_userplan_enum" DEFAULT 'FREE', "organizationId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "passwordResetToken" character varying(255), "passwordResetExpiresAt" TIMESTAMP, "signupToken" character varying(255), "signupTokenExpiresAt" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."roles_name_enum" AS ENUM('SUPER_ADMIN', 'ORG_OWNER', 'ORG_MEMBER', 'PUBLIC_USER')`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" "public"."roles_name_enum" NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "organos_contratacion" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "externalId" character varying NOT NULL, "nombre" character varying NOT NULL, "tipo" character varying, "ccaa" character varying, "provincia" character varying, "web" character varying, "plataforma" character varying NOT NULL DEFAULT 'PLACE', "activo" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8acaf902726d732936f42a91970" UNIQUE ("externalId"), CONSTRAINT "PK_4d4c0a9a20428f61c6e1ca11243" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8acaf902726d732936f42a9197" ON "organos_contratacion" ("externalId") `);
        await queryRunner.query(`CREATE TABLE "scraping_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "itemsNew" integer NOT NULL DEFAULT '0', "itemsUpdated" integer NOT NULL DEFAULT '0', "itemsErrors" integer NOT NULL DEFAULT '0', "duration" integer NOT NULL DEFAULT '0', "startedAt" TIMESTAMP WITH TIME ZONE, "finishedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_95c0f9df52096ddb8ede20bbdd5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auth_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_41e9ddfbb32da18c4e85e45c2fd" PRIMARY KEY ("id"))`);
        // Note: removed searchVector as it is added by a separate migration
        await queryRunner.query(`CREATE TABLE "licitaciones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "externalId" character varying NOT NULL, "source" character varying NOT NULL DEFAULT 'PLACE', "title" text NOT NULL, "description" text, "cpvCodes" text array NOT NULL DEFAULT '{}', "presupuestoBase" bigint, "presupuestoConIva" bigint, "tipoContrato" character varying, "procedimiento" character varying, "estado" character varying NOT NULL DEFAULT 'DESCONOCIDO', "tramitacion" character varying, "ccaa" character varying, "provincia" character varying, "municipio" character varying, "fechaPublicacion" TIMESTAMP WITH TIME ZONE, "fechaPresentacion" TIMESTAMP WITH TIME ZONE, "fechaAdjudicacion" TIMESTAMP WITH TIME ZONE, "fechaFormalizacion" TIMESTAMP WITH TIME ZONE, "adjudicatarioNombre" character varying, "adjudicatarioNif" character varying, "importeAdjudicacion" bigint, "porcentajeBaja" numeric(6,2), "numLicitadores" integer, "documentos" jsonb NOT NULL DEFAULT '[]', "tieneLotes" boolean NOT NULL DEFAULT false, "resumenIA" text, "pliegosProcesados" boolean NOT NULL DEFAULT false, "organoId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_378bbe0c37e96cf8297fb0efa68" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a21364be582456907dff3cd82d" ON "licitaciones" ("fechaPresentacion") `);
        await queryRunner.query(`CREATE INDEX "IDX_952c8b2c98af6bfb5d2eb26caf" ON "licitaciones" ("estado") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1dbc95e4d29fac76c61558862f" ON "licitaciones" ("externalId", "source") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "licitaciones" ADD CONSTRAINT "FK_101ff0c908b4673501ba6ee6d54" FOREIGN KEY ("organoId") REFERENCES "organos_contratacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "licitaciones" DROP CONSTRAINT "FK_101ff0c908b4673501ba6ee6d54"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1dbc95e4d29fac76c61558862f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_952c8b2c98af6bfb5d2eb26caf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a21364be582456907dff3cd82d"`);
        await queryRunner.query(`DROP TABLE "licitaciones"`);
        await queryRunner.query(`DROP TABLE "auth_tokens"`);
        await queryRunner.query(`DROP TABLE "scraping_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8acaf902726d732936f42a9197"`);
        await queryRunner.query(`DROP TABLE "organos_contratacion"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TYPE "public"."roles_name_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_userplan_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_timezone_enum"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
        await queryRunner.query(`DROP TYPE "public"."organizations_plan_enum"`);
    }

}
