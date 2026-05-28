import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reclasifica las licitaciones que tenían el código crudo de CODICE en `tipoContrato`
 * porque el parser viejo, ante un código desconocido, lo guardaba tal cual (en vez de
 * mapearlo a 'OTROS' como hace el parser nuevo).
 *
 * Códigos a reclasificar (verificados con datos reales en BD, mayo 2026):
 *   - '22' (2.964 filas) → CONCESION_SERVICIOS
 *   - '32' (40 filas)    → CONCESION_OBRAS
 *   - '50' (5.388 filas) → AUTORIZACION_DEMANIAL  (figura LPAP, no LCSP)
 *
 * RED DE SEGURIDAD:
 *   Antes del UPDATE, guarda el estado anterior en una tabla `licitaciones_tipo_backup`.
 *   Si hay que revertir, el `down()` lo restaura desde ahí. Una vez confirmado que todo
 *   va bien (pasados unos días o semanas), se puede borrar el backup a mano:
 *     DROP TABLE licitaciones_tipo_backup;
 *
 * IMPORTANTE: ejecuta el parser corregido ANTES o A LA VEZ que esta migración. Si no,
 * el scraper seguirá insertando códigos crudos nuevos y la BD se volverá a ensuciar.
 */
export class ReclassifyOrphanTipoContrato1780000000000
    implements MigrationInterface {
    name = 'ReclassifyOrphanTipoContrato1780000000000';

    public async up(q: QueryRunner): Promise<void> {
        // 1) Red de seguridad: guardamos id + valor anterior de las filas que vamos a tocar.
        //    Sin esto, el down() no podría distinguir un CONCESION_OBRAS legítimo de uno que
        //    vino del código '32'.
        await q.query(`
      CREATE TABLE IF NOT EXISTS "licitaciones_tipo_backup" (
        "id" uuid PRIMARY KEY,
        "tipoContrato_original" varchar NOT NULL,
        "backed_up_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

        await q.query(`
      INSERT INTO "licitaciones_tipo_backup" ("id", "tipoContrato_original")
      SELECT "id", "tipoContrato"
      FROM "licitaciones"
      WHERE "tipoContrato" IN ('22', '32', '50')
      ON CONFLICT ("id") DO NOTHING;
    `);

        // 2) Reclasificación. Una sentencia por mapeo, claro y trazable.
        await q.query(`
      UPDATE "licitaciones"
      SET "tipoContrato" = 'CONCESION_SERVICIOS'
      WHERE "tipoContrato" = '22';
    `);

        await q.query(`
      UPDATE "licitaciones"
      SET "tipoContrato" = 'CONCESION_OBRAS'
      WHERE "tipoContrato" = '32';
    `);

        await q.query(`
      UPDATE "licitaciones"
      SET "tipoContrato" = 'AUTORIZACION_DEMANIAL'
      WHERE "tipoContrato" = '50';
    `);
    }

    public async down(q: QueryRunner): Promise<void> {
        // Restaura los valores originales SOLO en las filas que se guardaron en el backup.
        // Esto evita el problema de no poder distinguir, p.ej., un CONCESION_OBRAS legítimo
        // de uno que vino del '32': la tabla de backup nos dice exactamente qué filas se
        // tocaron y qué tenían antes.
        const backupExists = await q.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'licitaciones_tipo_backup'
      ) AS exists;
    `);

        if (!backupExists?.[0]?.exists) {
            // El backup ya se borró manualmente; revertir sería destructivo y no fiable.
            throw new Error(
                'No existe licitaciones_tipo_backup: no se puede revertir esta migración con seguridad.',
            );
        }

        await q.query(`
      UPDATE "licitaciones" AS l
      SET "tipoContrato" = b."tipoContrato_original"
      FROM "licitaciones_tipo_backup" AS b
      WHERE l."id" = b."id";
    `);

        // No borramos el backup automáticamente: si el rollback fue por error y se vuelve a
        // aplicar la migración, el INSERT ... ON CONFLICT DO NOTHING del up() lo respeta.
        // El backup se borra a mano cuando ya no se necesita.
    }
}
