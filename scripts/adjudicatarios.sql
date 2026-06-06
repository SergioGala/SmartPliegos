-- Listado de empresas que ganan licitaciones (adjudicatarias), SIN duplicados por formato de NIF.
-- Normaliza el NIF antes de agrupar: lo pasa a mayusculas y le quita espacios, guiones y puntos,
-- asi "B-12.345.678", "b12345678" y " B12345678 " cuentan como la misma empresa.
--
-- Datos ya presentes en la tabla `licitaciones` (no requiere nada externo).
-- Nota: "importe_total" sale de importeAdjudicacion (bigint); revisa si tu ingesta lo guarda
-- en euros o en centimos para interpretarlo bien.
 
WITH limpio AS (
  SELECT
    -- NIF normalizado: mayusculas y solo letras/numeros
    regexp_replace(upper("adjudicatarioNif"), '[^A-Z0-9]', '', 'g') AS nif_norm,
    -- Si ves duplicados del tipo "ESB12345678" vs "B12345678", usa esta version en su lugar
    -- (descomenta esta y comenta la de arriba):
    -- regexp_replace(regexp_replace(upper("adjudicatarioNif"), '[^A-Z0-9]', '', 'g'), '^ES', '') AS nif_norm,
    "adjudicatarioNombre" AS nombre,
    "importeAdjudicacion" AS importe,
    "fechaAdjudicacion"   AS fecha
  FROM licitaciones
  WHERE "adjudicatarioNif" IS NOT NULL
    AND "adjudicatarioNif" <> ''
)
SELECT
  nif_norm        AS nif,
  MAX(nombre)     AS empresa,
  COUNT(*)        AS licitaciones_ganadas,
  SUM(importe)    AS importe_total,
  MAX(fecha)      AS ultima_adjudicacion
FROM limpio
WHERE nif_norm <> ''
GROUP BY nif_norm
ORDER BY importe_total DESC NULLS LAST;
 