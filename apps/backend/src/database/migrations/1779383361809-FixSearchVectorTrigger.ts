import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Arregla el conflicto de triggers de full-text search en `licitaciones`.
 *
 * Contexto del bug:
 *  - La migration 1715432700004 creó la columna `search_vector` (snake_case)
 *    + función `update_licitacion_search_vector()` + trigger
 *    `tg_licitacion_search_vector`, todos apuntando a `NEW.search_vector`.
 *  - Más tarde el proyecto estandarizó a `"searchVector"` (camelCase) vía la
 *    entidad + el endpoint `POST /scraping/migrations/create-search-trigger`,
 *    pero el trigger viejo quedó colgado apuntando a una columna que ya no
 *    existe. Como los triggers disparan en orden alfabético,
 *    `tg_licitacion_search_vector` corre antes que `trg_licitaciones_search`,
 *    falla con `record "new" has no field "search_vector"` y aborta cada
 *    INSERT/UPDATE del scraper (0 new, 0 updated, N errors).
 *
 * Esta migration deja UNA sola fuente de verdad: la columna camelCase
 * `"searchVector"` con su función/trigger/índice, y elimina el setup viejo.
 */
export class FixSearchVectorTrigger1779383361809 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar el setup viejo (snake_case) que rompe los upserts.
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS tg_licitacion_search_vector ON licitaciones;`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_licitacion_search_vector();`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_licitaciones_search_vector;`,
    );
    await queryRunner.query(
      `ALTER TABLE licitaciones DROP COLUMN IF EXISTS search_vector;`,
    );

    // 2. Asegurar la columna camelCase que espera la entidad (idempotente).
    await queryRunner.query(
      `ALTER TABLE licitaciones ADD COLUMN IF NOT EXISTS "searchVector" tsvector;`,
    );

    // 3. (Re)crear la función + trigger buenos (camelCase), mismo cuerpo que
    //    el endpoint create-search-trigger, ahora como fuente de verdad.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION licitaciones_search_trigger()
      RETURNS trigger AS $$
      BEGIN
        NEW."searchVector" :=
          setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
          setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
          setweight(to_tsvector('spanish', COALESCE(NEW."adjudicatarioNombre", '')), 'C') ||
          setweight(to_tsvector('spanish', COALESCE(NEW."adjudicatarioNif", '')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_licitaciones_search ON licitaciones;`,
    );
    await queryRunner.query(`
      CREATE TRIGGER trg_licitaciones_search
      BEFORE INSERT OR UPDATE OF title, description, "adjudicatarioNombre", "adjudicatarioNif"
      ON licitaciones
      FOR EACH ROW EXECUTE FUNCTION licitaciones_search_trigger();
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_licitaciones_search
      ON licitaciones USING GIN ("searchVector");
    `);

    // 4. Backfill de las filas existentes (el trigger UPDATE OF no dispara
    //    si no se tocan esas columnas, así que lo calculamos a mano).
    await queryRunner.query(`
      UPDATE licitaciones SET "searchVector" =
        setweight(to_tsvector('spanish', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('spanish', COALESCE("adjudicatarioNombre", '')), 'C') ||
        setweight(to_tsvector('spanish', COALESCE("adjudicatarioNif", '')), 'C');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir = quitar el setup camelCase de esta migration.
    // No restauramos el trigger snake_case viejo a propósito: estaba roto.
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_licitaciones_search ON licitaciones;`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS licitaciones_search_trigger();`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_licitaciones_search;`);
    await queryRunner.query(
      `ALTER TABLE licitaciones DROP COLUMN IF EXISTS "searchVector";`,
    );
  }
}