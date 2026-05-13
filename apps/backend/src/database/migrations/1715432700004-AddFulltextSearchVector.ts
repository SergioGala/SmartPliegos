import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFulltextSearchVector1715432700004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE licitaciones ADD COLUMN IF NOT EXISTS search_vector tsvector;`);
    await queryRunner.query(`
      UPDATE licitaciones 
      SET search_vector = to_tsvector('spanish', 
        COALESCE(title, '') || ' ' || COALESCE(description, '')
      )
      WHERE search_vector IS NULL;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_licitaciones_search_vector ON licitaciones USING GiST(search_vector);`);
    
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_licitacion_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector := to_tsvector('spanish', 
          COALESCE(NEW.title, '') || ' ' || 
          COALESCE(NEW.description, '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`DROP TRIGGER IF EXISTS tg_licitacion_search_vector ON licitaciones;`);
    await queryRunner.query(`
      CREATE TRIGGER tg_licitacion_search_vector
      BEFORE INSERT OR UPDATE ON licitaciones
      FOR EACH ROW
      EXECUTE FUNCTION update_licitacion_search_vector();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS tg_licitacion_search_vector ON licitaciones;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_licitacion_search_vector();`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_licitaciones_search_vector;`);
    await queryRunner.query(`ALTER TABLE licitaciones DROP COLUMN IF EXISTS search_vector;`);
  }
}
