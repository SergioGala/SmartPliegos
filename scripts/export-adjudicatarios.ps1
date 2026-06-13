#requires -Version 5.1
<#
  export-adjudicatarios.ps1
  Exporta el listado de empresas adjudicatarias a un CSV en UTF-8 (acentos y enes correctos),
  sin pelear con la codificacion de la consola de Windows.

  Uso (desde la raiz del proyecto):
    .\scripts\export-adjudicatarios.ps1
    .\scripts\export-adjudicatarios.ps1 -Out empresas.csv
    .\scripts\export-adjudicatarios.ps1 -DbUser postgres -DbName smartpliegos

  Si Windows bloquea el script por politica de ejecucion, lanzalo asi:
    powershell -ExecutionPolicy Bypass -File .\scripts\export-adjudicatarios.ps1

  Requiere el contenedor `postgres` levantado:  docker compose up -d
#>
param(
  [string]$Out    = "adjudicatarios.csv",
  [string]$Sql    = "adjudicatarios.sql",
  [string]$DbUser = "postgres",
  [string]$DbName = "smartpliegos"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Resuelve el .sql: si la ruta existe tal cual, la usa; si no, la busca junto al script
$sqlPath = if (Test-Path $Sql) { $Sql } else { Join-Path $PSScriptRoot $Sql }
if (-not (Test-Path $sqlPath)) {
  throw "No encuentro el SQL '$Sql'. Pasa una ruta valida con -Sql o deja el .sql junto a este script."
}

# ID del contenedor de postgres
$cid = (docker compose ps -q postgres | Select-Object -First 1)
if (-not $cid) {
  throw "El contenedor 'postgres' no esta levantado. Ejecuta primero: docker compose up -d"
}

$tmp = "/tmp/adjudicatarios_export.csv"

Write-Host "Exportando adjudicatarios desde la BD '$DbName'..."

# psql ejecuta la query (leida por stdin) y escribe el CSV DENTRO del contenedor.
# Asi los bytes UTF-8 no pasan por la tuberia de texto de PowerShell y no se corrompen.
Get-Content -Raw $sqlPath | docker compose exec -T postgres `
  psql -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -P format=csv -P footer=off -o $tmp

# Copia el fichero del contenedor a Windows sin tocar los bytes
docker cp "${cid}:${tmp}" $Out

# Limpia el temporal dentro del contenedor
docker compose exec -T postgres rm -f $tmp | Out-Null

$rows = (Get-Content $Out | Measure-Object -Line).Lines - 1
Write-Host "Listo: $rows empresas exportadas a $Out (UTF-8)"