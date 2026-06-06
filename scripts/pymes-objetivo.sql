-- PYMEs OBJETIVO (v2): empresas vendibles que licitan de forma activa.
--
-- Cambios vs v1:
--  - Excluye UTEs por NOMBRE (algunas llevan NIF de una empresa miembro A/B,
--    no de UTE, asi que el filtro por letra no las pillaba).
--  - Baja el techo de actividad de 100 a 25: quien gana ~100 licitaciones es un
--    licitador profesional o filial de multinacional (Allianz, Atos, Schindler...),
--    NO la PYME a la que quieres vender. El NIF no distingue una filial de gigante
--    de una S.L. local; lo unico que las separa es cuanto licitan.

WITH limpio AS (
  SELECT
    regexp_replace(upper("adjudicatarioNif"), '[^A-Z0-9]', '', 'g') AS nif_norm,
    "adjudicatarioNombre" AS nombre,
    "importeAdjudicacion" AS importe,
    "fechaAdjudicacion"   AS fecha
  FROM licitaciones
  WHERE "adjudicatarioNif" IS NOT NULL
    AND "adjudicatarioNif" <> ''
),
agregado AS (
  SELECT
    nif_norm,
    MAX(nombre)  AS empresa,
    COUNT(*)     AS licitaciones_ganadas,
    SUM(importe) AS importe_total,
    MAX(fecha)   AS ultima_adjudicacion
  FROM limpio
  WHERE nif_norm <> ''
    -- Solo sociedades mercantiles: A = S.A., B = S.L.
    AND LEFT(nif_norm, 1) IN ('A', 'B')
    -- Para incluir autonomos y cooperativas, cambia la linea de arriba por:
    --   AND ( LEFT(nif_norm,1) IN ('A','B','F','J')
    --         OR nif_norm ~ '^[0-9]{8}[A-Z]$'        -- autonomos (DNI)
    --         OR nif_norm ~ '^[XYZ][0-9]{7}[A-Z]$' ) -- autonomos (NIE)
  GROUP BY nif_norm
)
SELECT
  nif_norm              AS nif,
  empresa,
  licitaciones_ganadas,
  importe_total,
  ultima_adjudicacion
FROM agregado
WHERE licitaciones_ganadas BETWEEN 2 AND 25   -- (A) PYME activa, NO licitador profesional/gigante
  AND ultima_adjudicacion >= (CURRENT_DATE - INTERVAL '24 months')  -- (B) sigue activa
  AND empresa !~* '\mUTE\M'                    -- (C) fuera UTEs aunque lleven NIF de empresa
  -- (D) OPCIONAL: descartar empresas con contrato medio muy alto (probablemente no-PYME).
  --     Nota: el importe parece estar en CENTIMOS -> 50000000 = 500.000 euros de media.
  -- AND (importe_total / NULLIF(licitaciones_ganadas, 0)) < 50000000
ORDER BY licitaciones_ganadas DESC, ultima_adjudicacion DESC;