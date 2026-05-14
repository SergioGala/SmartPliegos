# SmartPliegos

SaaS B2B español para licitaciones públicas. Scrapea la Plataforma de Contratación del Sector Público (PLACE), procesa licitaciones con IA y notifica matches según alertas configurables.

## Stack

- **Backend**: NestJS 11 + TypeORM + PostgreSQL 16 + Redis 7
- **Frontend**: React 19 + Vite + TailwindCSS 4 + Base UI
- **Infra**: Turborepo, Docker, GitHub Actions
- **Observability**: Sentry, Winston, Terminus health checks

## Quick Start

### Requisitos

- Node.js 20+
- Docker Desktop
- npm 10+ (viene con Node 20)

### Setup

```bash
# 1. Clonar
git clone git@github.com:SergioGala/SmartPliegos.git
cd SmartPliegos

# 2. Instalar dependencias del monorepo
npm install

# 3. Configurar variables de entorno del backend
cp apps/backend/.env.example apps/backend/.env
# Editar apps/backend/.env con tus valores reales:
#   - DB_*  (las del docker-compose o las tuyas si tienes Postgres local)
#   - JWT_SECRET (generar con: openssl rand -hex 32)
#   - RESEND_API_KEY (desde resend.com/api-keys)
#   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (opcional, OAuth)

# 4. Levantar servicios Docker (Postgres, Redis, Qdrant)
docker compose up -d

# 5. Ejecutar migrations
cd apps/backend
npm run migration:run

# 6. Arrancar backend (terminal 1)
npm run start:dev
# → http://localhost:3000
# → Swagger: http://localhost:3000/docs

# 7. Arrancar frontend (terminal 2)
cd ../frontend
npm run dev
# → http://localhost:5173
```

### Verificar que todo está vivo

```bash
curl http://localhost:3000/health
```

Debería devolver `status: "ok"` con `database` y `redis` ambos `up`.

## Estructura

```
factum/
├── apps/
│   ├── backend/        # NestJS API
│   │   ├── src/
│   │   │   ├── modules/          # auth, users, alerts, licitaciones, scraping, ...
│   │   │   ├── common/           # decorators, guards, services compartidos
│   │   │   ├── config/           # env.config, typeorm.config, winston, swagger
│   │   │   ├── database/         # data-source.ts, migrations/
│   │   │   ├── infrastructure/   # redis (global), email
│   │   │   └── main.ts
│   │   ├── test/                 # e2e
│   │   └── docs/                 # observability.md, architecture.md
│   └── frontend/       # React + Vite
│       ├── src/
│       │   ├── features/         # auth, alerts, licitaciones, users, ...
│       │   ├── components/       # ui (base-ui), layout
│       │   ├── lib/, stores/, providers/, i18n/
│       │   └── main.tsx
│       └── tests/e2e/            # Playwright
├── docker-compose.yml
├── turbo.json
└── package.json        # monorepo root, workspaces apps/*
```

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca todos los apps en paralelo (turbo) |
| `npm run build` | Build de todos los apps |
| `npm run lint` | Lint de todos los apps |
| `npm run test` | Tests de todos los apps |
| `npm run docker:up` | `docker compose up -d` |
| `npm run docker:down` | `docker compose down` |
| `cd apps/backend && npm run migration:run` | Ejecutar migrations |
| `cd apps/backend && npm run migration:show` | Ver estado de migrations |

## Documentación

- `apps/backend/docs/architecture.md` — arquitectura del backend, módulos, decisiones.
- `apps/backend/docs/observability.md` — Sentry, Winston, health checks.

## Convenciones de desarrollo

- **Trunk-based**: push directo a `main` (sin PRs por ahora, con CI verde obligatorio).
- **Commits**: convencional (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
- **CI**: `.github/workflows/main-checks.yml` corre lint + build + test en cada push.
- **Migrations**: cada cambio de schema = una migration. NUNCA `synchronize: true`.

## Estado del proyecto

**Fase 1 (cerrada)**: setup + sprints técnicos (auth, email, OAuth, Redis, CI/CD, scraping, observabilidad).

**Fase 2 (siguiente)**: rediseño del modelo User/Org/Membership + migración a Zod + integración IA.

Ver `roadmap-smartpliegos-v1.md` (si existe) o el board del equipo para el detalle.