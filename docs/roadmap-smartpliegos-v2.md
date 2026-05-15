# 🗺️ SmartPliegos — Roadmap maestro v2

**Versión 2.0 · Mayo 2026**
**Sucede al [Roadmap v1](./roadmap-smartpliegos-v1.md)** · misma visión, mismo stack, ~12 meses. Lo que cambia es **cómo se organiza el trabajo**.

---

## Índice

- [0. Por qué v2](#0-por-qué-v2)
- [1. Visión, principios y stack](#1-visión-principios-y-stack)
- [2. Los 8 streams permanentes](#2-los-8-streams-permanentes)
- [3. Dependencias entre streams](#3-dependencias-entre-streams)
- [4. Hitos de producto (milestones)](#4-hitos-de-producto-milestones)
- [5. Cómo se planifica un sprint horizontal](#5-cómo-se-planifica-un-sprint-horizontal)
- [6. Backlog de sprints horizontales](#6-backlog-de-sprints-horizontales)
- [7. Convenciones y glosario](#7-convenciones-y-glosario)

---

## 0. Por qué v2

### 0.1 Lo que aprendimos del v1

El roadmap v1 organizaba el trabajo por **fases temporales secuenciales**: Fase 1 (saneamiento) → Fase 2 (modelo de datos) → Fase 3 (IA) → ... Cada fase la atacaba el equipo entero. Funcionó en Fase 1 (saneamiento) porque eran tareas pequeñas y separables.

Cuando llegamos al Sprint 2.1 (modelo multi-tenant) chocamos con un problema: **5 devs sobre el mismo modelo de datos = todo el mundo pisando o esperando**. Probamos varias planificaciones (asignación estática, pool kanban, fases con LOCK) y todas tenían algún cuello de botella.

### 0.2 La idea del v2

**Los streams independientes son la unidad real de paralelización**, no las fases. En vez de "5 devs hacen la Fase 2 entera", hacemos "5 devs avanzan en 5 streams distintos durante 2 semanas, repetido ~12 veces".

Esto exige:

1. Identificar bien los streams (zonas del repo que no se pisan).
2. Aceptar que **las fases del v1 desaparecen como unidad de planificación** — se quedan como hitos de producto opcionales (M1, M2...).
3. Definir las dependencias entre streams explícitamente y respetarlas en la planificación, no en el orden de los sprints.

### 0.3 Cómo se invoca un sprint detallado

En la próxima sesión, mensaje tipo:

> *"Genérame el Sprint H3 al detalle, formato carriles paralelos."*

O para una tarea específica de un stream:

> *"Desarrolla el paso 5 del Stream B (MembershipsModule) al detalle, como en el A2 v3."*

Claude genera el sprint/punto con código completo, tests, verificación.

---

## 1. Visión, principios y stack

Sin cambios respecto al v1, sección 1. Resumiendo:

- **Visión**: la mejor app de búsqueda de licitaciones públicas de España, diferenciándose de Tendios.
- **Cliente objetivo**: autónomos + empresas pequeñas-medianas (3-20 personas).
- **Modelo de cuentas**: Notion-style ("autónomo o empresa").
- **Modelo de pago**: Free / Pro (~49-69€) / Business (~99-149€) + créditos IA.
- **Stack**: NestJS + TypeORM + Postgres + Redis + Qdrant + React + Vite + Zustand + shadcn/ui + Stripe + Resend.
- **Equipo**: Sergio (lead) + 4 devs generalistas.
- **Branching**: feature branches + PR a `main` durante MVP. Trunk-based con feature flags después.

Lo que el v2 añade al v1:

- **Equipo en modo carriles**: cada dev coge un stream por sprint. Rotación cada sprint para evitar especialización forzada.
- **Sprint duration**: 1-2 semanas, sincronización solo en hitos M.

---

## 2. Los 8 streams permanentes

Un stream es **una zona aislada del repo + un mini-roadmap interno**. Los devs trabajan dentro de un stream durante el sprint y nunca tocan otro carril.

### Stream A · Infraestructura

**Zona del repo**:
```
.github/
apps/backend/src/main.ts
apps/backend/src/infrastructure/
docker-compose.yml
apps/backend/src/config/
```

**Mini-roadmap interno** (orden recomendado):

| # | Tarea | Ref v1 |
|---|---|---|
| A1 | CI/CD GitHub Actions con lint+test+build | 1.7.1 |
| A2 | Sentry backend con DSN por env | 1.7.2 |
| A3 | Winston logs estructurados JSON | 1.7.3 |
| A4 | Unificación cliente Redis (RedisModule global) | 1.5 |
| A5 | Aislamiento email Resend | 1.1.1 |
| A6 | Aislamiento Google OAuth | 1.1.2 |
| A7 | Rotación JWT_SECRET + validación variables env con Zod | 1.1.3 + 1.1.4 |
| A8 | CORS production-ready con whitelist por env | 1.8.3 |
| A9 | Hosting setup (Railway o Render) | nuevo |
| A10 | UptimeRobot monitoreo endpoints críticos | 7.1.2 |

**Dependencias externas**: ninguna. Stream totalmente independiente.

### Stream B · Modelo y datos

**Zona del repo**:
```
apps/backend/src/modules/users/
apps/backend/src/modules/organizations/
apps/backend/src/modules/memberships/        (nuevo)
apps/backend/src/modules/invitations/
apps/backend/src/modules/plans/
apps/backend/src/modules/permissions/
apps/backend/src/database/migrations/
packages/shared/schemas/                     (cuando se monte)
```

**Mini-roadmap interno**:

| # | Tarea | Ref v1 |
|---|---|---|
| B1 | Sistema migrations TypeORM CLI | 1.3 |
| B2 | Migración a Zod en backend DTOs | 1.4 |
| B3 | MembershipEntity + migración SQL | 2.1.2 + 2.1.3 |
| B4 | Refactor UsersService al modelo nuevo | 2.2.1 |
| B5 | Refactor OrganizationsService | 2.2.2 |
| B6 | MembershipsModule nuevo (CRUD + endpoints) | 2.2.3 |
| B7 | InvitationsModule refactor con tokens email | 2.2.4 |
| B8 | PlansModule refactor (User vs Org) | 2.2.5 |
| B9 | PermissionsModule simplificado | 2.2.6 |
| B10 | Sistema auditoría real (AuditInterceptor) | 2.3 |
| B11 | Soft delete real con TypeORM | 2.4 |
| B12 | Frontend adapt al nuevo modelo (login, org switcher) | 2.5 |

**Dependencias externas**: ninguna.

**Este stream bloquea a**: Stream E (Monetización) y Stream G (Features pesadas como Kanban).

### Stream C · Data ingestion (scrapers)

**Zona del repo**:
```
apps/backend/src/modules/scraping/place/         (existente, refactor)
apps/backend/src/modules/scraping/boe/           (nuevo)
apps/backend/src/modules/scraping/bdns/          (nuevo)
apps/backend/src/modules/scraping/ted/           (nuevo)
apps/backend/src/modules/scraping/madrid/        (nuevo)
apps/backend/src/modules/scraping/galicia/       (nuevo)
apps/backend/src/modules/scraping/andalucia/     (nuevo)
apps/backend/src/modules/scraping/pscp/          (nuevo)
apps/backend/src/modules/scraping/euskadi/       (nuevo)
```

**Mini-roadmap interno**:

| # | Tarea | Ref v1 |
|---|---|---|
| C1 | Seguridad scraping PLACE (eliminar `rejectUnauthorized: false`) | 1.6.1 |
| C2 | Protección endpoints scraping con `@RequireRoles(SUPER_ADMIN)` | 1.6.2 |
| C3 | Scraper BOE sección III | T.2.1 |
| C4 | Scraper BDNS subvenciones | T.2.2 |
| C5 | Scraper TED UE | T.2.3 |
| C6 | Scraper Madrid | T.2.4 |
| C7 | Scraper Galicia | T.2.4 |
| C8 | Scraper Andalucía | T.2.4 |
| C9 | Scraper PSCP Cataluña | T.2.5 |
| C10 | Scraper País Vasco | T.2.6 |
| C11 | Scraper adjudicaciones históricas PLACE | 3.6.1 |

**Dependencias externas**: ninguna. Cada scraper es un módulo nuevo independiente del resto.

### Stream D · IA

**Zona del repo**:
```
apps/backend/src/infrastructure/ai/             (nuevo)
apps/backend/src/modules/ai/                    (nuevo)
apps/backend/src/modules/ai-credits/            (nuevo)
docker-compose.yml                              (añadir qdrant)
```

**Mini-roadmap interno**:

| # | Tarea | Ref v1 |
|---|---|---|
| D1 | Setup Qdrant + módulo IA base (Anthropic/OpenAI/embeddings) | 3.1.1 + 3.1.2 |
| D2 | Sistema tokens y créditos IA | 3.1.3 |
| D3 | Resumen automático de pliegos (backend + UI) | 3.2 |
| D4 | Indexación semántica de licitaciones (288K embeddings) | 3.3 |
| D5 | Chat con pliego RAG (backend + UI streaming) | 3.4 |
| D6 | Score de viabilidad | 3.5 |
| D7 | Análisis de competencia IA (depende de C11) | 3.6.2 + 3.6.3 |
| D8 | Tests integración IA con mocks | 3.7.1 |

**Dependencias externas**:
- D7 (análisis de competencia) necesita C11 (scraper de adjudicaciones).

### Stream E · Monetización y compliance

**Zona del repo**:
```
apps/backend/src/modules/billing/              (nuevo)
apps/backend/src/modules/legal/                (nuevo)
apps/frontend/src/features/billing/            (nuevo)
apps/frontend/src/features/legal/              (nuevo)
```

**Mini-roadmap interno**:

| # | Tarea | Ref v1 |
|---|---|---|
| E1 | Setup Stripe + cuenta + productos | 5.1.1 |
| E2 | BillingModule con StripeService | 5.1.2 |
| E3 | Webhooks Stripe (`checkout.completed`, `subscription.*`) | 5.1.2 |
| E4 | UI billing (checkout, manage subscription) | 5.1.3 |
| E5 | Compra de créditos IA one-time | 5.2 |
| E6 | Documentos legales (T&C, privacidad, cookies, DPA) | 5.3.1 |
| E7 | Cookie banner granular | 5.3.2 |
| E8 | Export de datos GDPR | 5.3.3 |
| E9 | Eliminar cuenta GDPR (30 días) | 5.3.4 |
| E10 | Cifrado columnas sensibles con pgcrypto | 5.3.5 |

**Dependencias externas**:
- E1-E5 (Stripe entero) necesita Stream B paso B6 cerrado (modelo memberships sólido).
- E5 (créditos IA) necesita Stream D paso D2 cerrado (sistema de tokens).

### Stream F · Frontend UI

**Zona del repo**:
```
apps/frontend/src/components/
apps/frontend/src/i18n/
apps/frontend/src/lib/
apps/frontend/src/styles/
apps/frontend/src/hooks/                       (los compartidos, no de features)
apps/frontend/public/                          (manifest PWA, iconos)
```

**Mini-roadmap interno**:

| # | Tarea | Ref v1 |
|---|---|---|
| F1 | Migración Base UI → shadcn/ui (si confirmado) | T.1.1 |
| F2 | Eliminar inline styles a Tailwind classes | T.1.2 |
| F3 | Locale dinámico (quitar `'es-ES'` hardcoded) | T.1.3 |
| F4 | Migrar strings UI restantes a i18n | T.1.4 |
| F5 | Auditoría de componentes duplicados | T.1.5 |
| F6 | Command palette ⌘K global | T.8 |
| F7 | PWA (manifest, service worker) | T.5.1 |
| F8 | Push notifications con Web Push API | T.5.2 |
| F9 | Optimizaciones móvil del frontend | T.5.3 |
| F10 | Cookie consent component (parte UI) | 5.3.2 frontend |

**Dependencias externas**: ninguna.

### Stream G · Features de producto

**Zona del repo**:
```
apps/frontend/src/features/alertas/
apps/frontend/src/features/dashboard/
apps/frontend/src/features/favoritos/
apps/frontend/src/features/kanban/
apps/frontend/src/features/calendario/
apps/frontend/src/features/vault/
apps/frontend/src/features/exports/
apps/frontend/src/features/comments/

apps/backend/src/modules/alerts/
apps/backend/src/modules/dashboard/
apps/backend/src/modules/favorites/
apps/backend/src/modules/kanban/
apps/backend/src/modules/calendar/
apps/backend/src/modules/vault/
apps/backend/src/modules/exports/
apps/backend/src/modules/comments/
```

**Mini-roadmap interno**:

| # | Tarea | Ref v1 |
|---|---|---|
| G1 | Sistema de alertas avanzado backend (modelo + engine) | 4.1.1 + 4.1.2 |
| G2 | Sistema híbrido notificaciones (instantáneo + digest) | 4.1.3 |
| G3 | UI alertas (wizard + preview + página) | 4.1.4 |
| G4 | Dashboard backend (endpoints stats) | 4.2.1 |
| G5 | Dashboard UI (heatmap, gráficos, widgets) | 4.2.2-4.2.4 |
| G6 | Favoritos y notas | 4.3 |
| G7 | Tablero Kanban (estados, drag&drop) | 4.4 |
| G8 | Calendario de plazos + reminders | 4.5 |
| G9 | Vault de documentos (S3, upload) | 4.6 |
| G10 | Exports Excel + PDF | 4.7 |
| G11 | Comentarios y colaboración entre equipo | T.9 |

**Dependencias externas**:
- G7 (Kanban) necesita Stream B paso B6 (memberships) para asignar a miembros de org.
- G9 (Vault) necesita Stream B paso B5 (organizations bien definido).
- G11 (Comentarios) necesita Stream B paso B6 (memberships).

### Stream H · Launch y beta

**Zona del repo**:
```
apps/landing/                                  (nuevo, separado del frontend SaaS)
apps/frontend/src/pages/pricing/
apps/admin/                                    (panel admin interno, nuevo)
docs/legal/
```

**Mini-roadmap interno**:

| # | Tarea | Ref v1 |
|---|---|---|
| H1 | PostHog setup + consent | 7.1.1 |
| H2 | Dashboards admin internos (uso, ingresos, bugs) | 7.1.3 |
| H3 | Landing optimizada SEO (Lighthouse 95+) | 7.2.1 |
| H4 | Blog estructura + primeros artículos | 7.2.2 |
| H5 | Pricing page con FAQs y casos de uso | 7.2.3 |
| H6 | Sistema i18n para emails (Handlebars o MJML) | 6.3.1 |
| H7 | Traducciones EN urgente, CA/GL/EU si demanda | 6.3.2 |
| H8 | Reclutamiento 10-15 candidatos beta | 6.1.1 |
| H9 | Soporte alto durante beta (Slack/email directo) | 6.1.2 |
| H10 | Anuncio público LinkedIn + comunidades B2B | 7.3 |
| H11 | Estabilización post-launch (bugs + perf) | 7.4 |

**Dependencias externas**:
- H1-H7 (preparación) pueden empezar cuando haya producto demoable.
- H8-H10 (beta + launch) necesitan M4+ alcanzado.

---

## 3. Dependencias entre streams

```
A (infra)         ──────────────────────────  independiente
B (modelo)        ──────────────────────────  independiente
C (scrapers)      ──────────────────────────  independiente
D (IA)            ────────── D7 ◄── C11 ────
F (frontend UI)   ──────────────────────────  independiente

E (monetización)  ◄── B6 (memberships)
                  ◄── D2 (tokens IA)

G (features)      ◄── B6 (memberships) para G7, G11
                  ◄── B5 (orgs) para G9

H (launch)        ◄── M4 alcanzado (producto vendible)
```

Solo 4 streams tienen dependencias externas. El resto (A, B, C, D, F) son completamente independientes y pueden avanzar siempre.

---

## 4. Hitos de producto (milestones)

Las "fases" del v1 se reformulan como hitos de producto. **No son ventanas temporales — son estados del producto**.

| Hito | Definición | Streams que deben tener X% |
|---|---|---|
| **M1 · Backend saneado** | Sin deuda visible, Sentry capturando, CI verde | A1-A8 + B1-B2 + C1-C2 |
| **M2 · Modelo multi-tenant** | Memberships funcionando, audit log, soft delete | B3-B11 |
| **M3 · IA básica** | Resumen automático de pliegos funcionando | D1-D3 |
| **M4 · Diferenciador competitivo** | App con alertas, dashboard, favoritos, kanban, calendario | G1-G8 + F1-F4 |
| **M5 · IA avanzada** | Búsqueda semántica + chat con pliego + score viabilidad | D4-D6 |
| **M6 · Monetización** | Cobramos dinero (Stripe + GDPR) | E1-E10 |
| **M7 · Beta privada cerrada** | 5-10 clientes pagando | H8-H9 |
| **M8 · Launch público** | Anuncio en LinkedIn, comunidades B2B | H10 |

**Orden de dependencias entre hitos**:

```
M1, M2, M3 en paralelo
        │
        ▼
M4 (necesita M2)        M5 (necesita M3 + M4 parcial)        M6 (necesita M2 + D2)
        │                        │                                    │
        └────────────────────────┴────────────────────────────────────┘
                                 │
                                 ▼
                            M7 (necesita M4 + M6)
                                 │
                                 ▼
                            M8 (necesita M7)
```

---

## 5. Cómo se planifica un sprint horizontal

### 5.1 Estructura

Cada sprint dura **1-2 semanas** y activa **5 carriles** de los 8 streams. Los 5 carriles se eligen mirando:

1. ¿Qué stream tiene la tarea más prioritaria pendiente?
2. ¿Está esa tarea "ready" (sin dependencias bloqueadas)?
3. ¿Tenemos un dev disponible que la coja sin meterse en una zona que no domine?

### 5.2 Plantilla

```
Sprint H_N
├── Carril 1 (Dev A): Stream X, paso Y
├── Carril 2 (Dev B): Stream Z, paso W
├── Carril 3 (Dev C): Stream P, paso Q
├── Carril 4 (Dev D): Stream R, paso S
└── Carril 5 (Dev E): Stream T, paso U
```

### 5.3 Reglas del sprint

1. **Trunk-based en main**. Cada dev pushea cuando puede.
2. **Cero coordinación entre carriles**: cada uno en zona aislada del repo.
3. **El sprint cierra cuando los 5 carriles cierran**. Si uno se atasca, los otros 4 siguen.
4. **Dependencias se resuelven en la planificación**: si Stream E necesita B6, no se activa E hasta que B6 esté cerrado en algún sprint anterior.
5. **Únicos puntos de cruce**: `app.module.ts` y `package.json` (cuando dos streams crean módulos o instalan deps). Se resuelven con `git pull --rebase` trivial al pushear.

### 5.4 Rotación de devs

Convención sugerida: **rotación cada sprint**. En H1 Dev 1 coge Stream A, en H2 coge Stream D, en H3 coge Stream F. Así todos se vuelven generalistas y nadie se queda como "el del frontend para siempre".

Si un stream tiene cosas muy específicas (Stripe, Qdrant, Stripe Webhooks...), conviene que el dev que arrancó ese stream continúe con la siguiente tarea del mismo stream — pero NO obligatorio.

### 5.5 Cierre de sprint

1. ✅ Los 5 carriles cerrados con CI verde.
2. ✅ Demo de 5 minutos por carril (5 × 5 = 25 min total).
3. ✅ Retro de 15 min: qué carriles se han atascado, qué rotaciones evitar.
4. ✅ Roadmap v2 actualizado con checkmarks en los pasos cerrados.
5. ✅ Planificación de Sprint H_N+1 (15 min).

---

## 6. Backlog de sprints horizontales

Propuesta inicial. Se ajusta según vaya saliendo.

### Sprint H1 — "Arranque por streams"

| Carril | Stream | Tarea |
|---|---|---|
| 1 | A · Infra | A1+A2+A3 — CI/CD + Sentry + Winston |
| 2 | B · Modelo | B1 — Sistema migrations TypeORM CLI |
| 3 | C · Scrapers | C3 — Scraper BOE sección III |
| 4 | D · IA | D1 — Setup Qdrant + módulo IA base |
| 5 | F · Frontend UI | F1+F2 — shadcn migration + inline styles |

### Sprint H2

| Carril | Stream | Tarea |
|---|---|---|
| 1 | A · Infra | A5+A6 — Resend + Google OAuth aislamiento |
| 2 | B · Modelo | B2 — Migración Zod backend DTOs |
| 3 | C · Scrapers | C4 — Scraper BDNS |
| 4 | D · IA | D2 — Sistema tokens y créditos IA |
| 5 | F · Frontend UI | F3+F4 — Locale dinámico + i18n strings |

### Sprint H3

| Carril | Stream | Tarea |
|---|---|---|
| 1 | A · Infra | A4 — Unificación cliente Redis |
| 2 | B · Modelo | B3 — MembershipEntity + migración |
| 3 | C · Scrapers | C6+C7 — Scrapers Madrid + Galicia |
| 4 | D · IA | D3 — Resumen automático pliegos (parte backend) |
| 5 | F · Frontend UI | F6 — Command palette ⌘K |

### Sprint H4 — "M1 alcanzable"

| Carril | Stream | Tarea |
|---|---|---|
| 1 | A · Infra | A7+A8 — JWT rotación + CORS production |
| 2 | B · Modelo | B4+B5 — Refactor Users + Orgs services |
| 3 | C · Scrapers | C5 — Scraper TED UE |
| 4 | D · IA | D3 — Resumen pliegos (parte UI + métricas) |
| 5 | G · Features | G1 — Alertas avanzadas (modelo + engine) |

✅ **M1 cerrado**: backend saneado, infra completa, primer scraper nuevo, IA base.

### Sprint H5

| Carril | Stream | Tarea |
|---|---|---|
| 1 | B · Modelo | B6 — MembershipsModule nuevo |
| 2 | B · Modelo | B7 — InvitationsModule refactor |
| 3 | D · IA | D4 — Indexación semántica licitaciones |
| 4 | G · Features | G2+G3 — Notifs híbridas + UI alertas |
| 5 | H · Launch | H6 — Sistema i18n emails |

> Aquí B se duplica: dos devs en el stream B porque es el camino crítico para abrir Stream E y G7.

### Sprint H6 — "M2 alcanzable"

| Carril | Stream | Tarea |
|---|---|---|
| 1 | B · Modelo | B8+B9 — PlansModule + PermissionsModule |
| 2 | B · Modelo | B10 — Sistema auditoría real |
| 3 | D · IA | D5 — Chat con pliego RAG |
| 4 | E · Monetización | E1+E2 — Setup Stripe + BillingModule |
| 5 | G · Features | G4+G5 — Dashboard backend + UI |

✅ **M2 cerrado**: modelo multi-tenant funcional. Desbloquea Stripe (E) y features pesadas (G7, G11).

### Sprint H7

| Carril | Stream | Tarea |
|---|---|---|
| 1 | B · Modelo | B11+B12 — Soft delete + frontend adapt |
| 2 | C · Scrapers | C8+C9 — Andalucía + PSCP Cataluña |
| 3 | D · IA | D6 — Score de viabilidad |
| 4 | E · Monetización | E3+E4 — Webhooks Stripe + UI billing |
| 5 | G · Features | G6 — Favoritos y notas |

### Sprint H8 — "M3 + M5 alcanzables"

| Carril | Stream | Tarea |
|---|---|---|
| 1 | C · Scrapers | C11 — Adjudicaciones históricas PLACE |
| 2 | D · IA | D7 — Análisis competencia IA |
| 3 | E · Monetización | E5+E6 — Créditos IA + Documentos legales |
| 4 | F · Frontend UI | F7+F8 — PWA + push notifications |
| 5 | G · Features | G7 — Tablero Kanban |

✅ **M3 cerrado** (IA básica). ✅ **M5 cerrado** (IA avanzada).

### Sprint H9 — "M4 alcanzable"

| Carril | Stream | Tarea |
|---|---|---|
| 1 | E · Monetización | E7+E8 — Cookie banner + Export GDPR |
| 2 | G · Features | G8 — Calendario de plazos |
| 3 | G · Features | G9 — Vault de documentos |
| 4 | G · Features | G10 — Exports Excel + PDF |
| 5 | H · Launch | H1+H2 — PostHog + Dashboards admin |

✅ **M4 cerrado**: producto con todas las features diferenciadoras.

### Sprint H10 — "M6 alcanzable"

| Carril | Stream | Tarea |
|---|---|---|
| 1 | E · Monetización | E9+E10 — Eliminar cuenta GDPR + cifrado |
| 2 | F · Frontend UI | F10 — Cookie consent UI |
| 3 | G · Features | G11 — Comentarios y colaboración |
| 4 | H · Launch | H3+H5 — Landing + Pricing page |
| 5 | H · Launch | H4 — Blog estructura + artículos |

✅ **M6 cerrado**: cobramos dinero, compliance OK.

### Sprint H11 — "Beta arranca"

| Carril | Stream | Tarea |
|---|---|---|
| 1 | H · Launch | H7 — Traducciones EN + CA si demanda |
| 2 | H · Launch | H8 — Reclutamiento beta testers |
| 3 | H · Launch | H9 — Soporte alto durante beta |
| 4-5 | (varias) | Iteración rápida sobre feedback inicial |

### Sprint H12+ — "Launch público"

- H10 — Anuncio LinkedIn
- H11 — Estabilización post-launch
- Iteraciones sobre feedback

✅ **M7** y **M8** alcanzados.

---

## 7. Convenciones y glosario

### 7.1 Convenciones de código

Mismas que v1:

- Inglés en código, español en comentarios.
- TypeScript strict mode.
- `camelCase` variables, `PascalCase` clases, `UPPER_SNAKE` constantes, `kebab-case` archivos.
- Tests: `*.spec.ts` (unit), `*.e2e-spec.ts` (e2e).

### 7.2 Conventional commits

```
feat(stream-X): descripción
fix(stream-X): descripción
chore(stream-X): descripción
refactor(stream-X): descripción
test(stream-X): descripción
docs(stream-X): descripción
```

Donde `stream-X` puede ser el nombre del módulo afectado o el código del stream (`stream-a`, `stream-b`, etc.).

### 7.3 Convenciones de PRs

- Título descriptivo + referencia al paso del stream (ej: `feat(stream-b): B6 MembershipsModule endpoints`).
- Descripción: contexto + cambios + testing manual.
- CI verde.
- Mínimo 1 review aprobando.

### 7.4 Glosario

- **Stream**: zona aislada del repo + mini-roadmap interno. 8 en total (A-H).
- **Carril**: instancia activa de un stream en un sprint concreto. 5 carriles por sprint.
- **Sprint horizontal** (H): unidad de trabajo de 1-2 semanas, activa 5 carriles paralelos.
- **Hito de producto** (M): estado verificable del producto, marca milestone para externos (beta, launch).
- **PLACE, CODICE, CPV, DEUC, NUTS3, CCAA**: igual que v1 (glosario en sección 10.4 del v1).

### 7.5 Roles

- **Sergio**: lead técnico. Decide prioridades de sprint, hace planning, valida cierres. Coge 1 carril por sprint si quiere o supervisa los 5.
- **Devs (4)**: generalistas en rotación. En cada sprint cogen un carril distinto del anterior cuando sea viable.
- **Claude**: genera sprints detallados a petición, revisa código, propone arquitectura.

---

## 📌 Próximos pasos inmediatos

1. **Sergio:** validar este v2 con el equipo. ¿Encaja la idea de streams permanentes?
2. **Sergio + equipo:** decidir si M1 es el primer hito objetivo o si ya saltamos a M2 (modelo multi-tenant).
3. **Si encaja**: ejecutar Sprint H1 con documento detallado al estilo A2 v3 (uno por carril).
4. **A medida que se ejecuten sprints**: actualizar checkmarks en los pasos de cada stream.

---

*Roadmap v2.0 — SmartPliegos · modo carriles paralelos · sucede a v1.0 de mayo 2026*
