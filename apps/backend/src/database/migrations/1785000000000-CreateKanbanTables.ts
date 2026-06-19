import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKanbanTables1785000000000 implements MigrationInterface {
  name = 'CreateKanbanTables1785000000000';

  public async up(q: QueryRunner): Promise<void> {
    // 1. Boards
    await q.query(`
      CREATE TABLE "kanban_boards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_kanban_boards" PRIMARY KEY ("id"),
        CONSTRAINT "uq_kanban_boards_organization" UNIQUE ("organizationId")
      );
    `);

    // 2. Columns
    await q.query(`
      CREATE TABLE "kanban_columns" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "boardId" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "color" varchar(50),
        "position" integer NOT NULL,
        "isTerminal" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_kanban_columns" PRIMARY KEY ("id"),
        CONSTRAINT "fk_kanban_columns_board" FOREIGN KEY ("boardId") REFERENCES "kanban_boards"("id") ON DELETE CASCADE
      );
    `);
    await q.query(`CREATE INDEX "idx_kanban_column_board_position" ON "kanban_columns" ("boardId", "position");`);

    // 3. Cards
    await q.query(`
      CREATE TABLE "kanban_cards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "columnId" uuid NOT NULL,
        "licitacionId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "position" integer NOT NULL,
        "notes" text,
        "assignedToId" uuid,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_kanban_cards" PRIMARY KEY ("id"),
        CONSTRAINT "uq_kanban_cards_org_licitacion" UNIQUE ("organizationId", "licitacionId"),
        CONSTRAINT "fk_kanban_cards_column" FOREIGN KEY ("columnId") REFERENCES "kanban_columns"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_kanban_cards_licitacion" FOREIGN KEY ("licitacionId") REFERENCES "licitaciones"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_kanban_cards_assigned_user" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);
    await q.query(`CREATE INDEX "idx_kanban_card_column_position" ON "kanban_cards" ("columnId", "position");`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "kanban_cards";`);
    await q.query(`DROP TABLE "kanban_columns";`);
    await q.query(`DROP TABLE "kanban_boards";`);
  }
}
