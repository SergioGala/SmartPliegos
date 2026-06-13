#!/usr/bin/env bash
#
# Exporta el listado de empresas adjudicatarias a un CSV que puedes abrir en
# Excel y usar para buscar teléfonos a mano en Google.
#
# Uso:
#   ./scripts/export-adjudicatarios.sh                 -> adjudicatarios.csv
#   ./scripts/export-adjudicatarios.sh empresas.csv    -> empresas.csv
#
# Por defecto usa el Postgres del docker-compose. Si tu BD está en otro sitio,
# sobreescribe con variables de entorno:
#   DB_USER=... DB_NAME=... ./scripts/export-adjudicatarios.sh
#
# Requiere que el contenedor `postgres` esté levantado (docker compose up -d).

set -euo pipefail

OUT="${1:-adjudicatarios.csv}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-smartpliegos}"

echo "Exportando adjudicatarios desde la BD '${DB_NAME}'..."

docker compose exec -T postgres \
  psql -U "${DB_USER}" -d "${DB_NAME}" \
       -v ON_ERROR_STOP=1 \
       -P format=csv -P footer=off \
       -f - < "${SCRIPT_DIR}/adjudicatarios.sql" \
  > "${OUT}"

ROWS=$(($(wc -l < "${OUT}") - 1))
echo "Listo: ${ROWS} empresas exportadas a ${OUT}"