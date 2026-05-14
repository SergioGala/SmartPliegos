# Arquitectura del Backend

## Visión general

NestJS modular monolithic. Cada feature en un módulo independiente bajo `src/modules/`. Servicios cross-cutting en `src/common/` (decorators, guards, filters, interceptors, services).

```
src/
├── main.ts                  # bootstrap, Sentry, Swagger, global pipes/filters
├── app.module.ts            # registra todos los módulos
│
├── modules/
│   ├── auth/                # login, signup, JWT, OAuth Google, refresh tokens
│   ├── users/               # CRUD usuarios + submódulos (organizations, plans, permissions, profile)
│   ├── invitations/         # invitaciones a organizaciones
│   ├── alerts/              # alertas de licitaciones + scheduler diario
│   ├── licitaciones/        # endpoints públicos de búsqueda de licitaciones
│   ├── organos/             # endpoints públicos de órganos contratantes
│   ├── scraping/            # scraping de PLACE (Plataforma Contratación Sector Público)
│   ├── search/              # motor de búsqueda con stemming + fuzzy + ranking
│   └── health/              # /health endpoint (Terminus)
│
├── common/                  # cross-cutting
│   ├── decorators/          # @CurrentUser, @RequireRoles, @ValidateResourceExists, ...
│   ├── guards/              # JwtAuthGuard, RoleGuard, OwnershipGuard, RateLimitGuard, ...
│   ├── filters/             # HttpExceptionFilter, SentryExceptionFilter
│   ├── interceptors/        # ResponseInterceptor (formato uniforme)
│   ├── services/            # BruteForceService, RateLimitService (basados en Redis)
│   └── email-templates/     # plantillas HTML para emails transaccionales
│
├── config/                  # env.schema, env.config, typeorm.config, winston, morgan
├── database/                # data-source.ts (TypeORM CLI), migrations/
└── infrastructure/          # email (Resend), redis (cliente global)
```

---

## Flujos clave

### Flujo 1 — Signup en 2 pasos

```
1. POST /api/v1/auth/signup
   ↓ AuthService.signup(email)
   → Crea UserEntity con status 'pending' (sin password aún)
   → Genera signupToken
   → Envía email con link /complete-signup?token=XXX
   ← 200 { message: "check your email" }

2. Usuario hace click en link → frontend muestra form de password
3. POST /api/v1/auth/complete-signup
   ↓ AuthService.completeSignup(token, password)
   → Verifica token
   → Hashea password con bcrypt
   → Marca user como 'active'
   ← 200 { access_token, refresh_token, user }
```

### Flujo 2 — Login + refresh tokens

```
1. POST /api/v1/auth/login (email, password)
   → BruteForceService chequea si IP está bloqueada
   → Valida credenciales contra DB
   → Si OK: emite access_token (1h) + refresh_token (7d)
   ← 200 { access_token, refresh_token, user }

2. Cliente usa access_token para llamadas siguientes
3. Cuando expira → POST /api/v1/auth/refresh con refresh_token
   → Verifica que el token no esté en blacklist Redis
   → Verifica JWT signature
   → Blacklist el viejo refresh_token con TTL = remaining lifetime
   → Emite nuevo par (access + refresh)
   ← 200 { access_token, refresh_token }

4. Logout → POST /api/v1/auth/logout (refresh_token en body)
   → Añade refresh_token a blacklist Redis con TTL
   → Cliente borra ambos tokens
```

### Flujo 3 — Scraping de PLACE

```
1. SUPER_ADMIN dispara POST /api/v1/scraping/place
   o cron diario a las 6am dispara ScrapingScheduler

2. PlaceScraperService:
   a. Descarga ATOM feed de PLACE
   b. CodiceParser parsea XML → Array<ParsedLicitacion>
   c. Por cada licitación:
      - upsert OrganoContratacion (si no existía, crear)
      - upsert Licitacion (si existía con mismo externalId, update; si no, create)
   d. Actualiza ScrapingLog con stats

3. Por cada licitación nueva o modificada:
   a. AlertsService.matchAlerts(licitacion)
   b. Para cada match → envía email al usuario suscrito (con throttling)
```

### Flujo 4 — Health check

```
GET /health (sin /api/v1 prefix, excluido del global prefix)
↓
HealthController.check()
↓ ejecuta en paralelo:
  - db.pingCheck('database')        ← TypeORM SELECT 1
  - redis.ping()                     ← REDIS_CLIENT ping
↓
Si TODO ok → 200 { status: "ok", info, details }
Si ALGO falla → 503 { status: "error", error: { ... }, details }
```

---

## Patrones de DI

### Inyección de Redis

`infrastructure/redis/redis.module.ts` exporta `REDIS_CLIENT` (Symbol) como provider `@Global()`. Cualquier servicio puede inyectarlo:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../../infrastructure/redis';
import type { RedisClientType } from 'redis';

@Injectable()
export class MyService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClientType,
  ) {}
}
```

> Nota: `RedisClientType` se importa con `import type` por la regla `isolatedModules + emitDecoratorMetadata` cuando se usa como tipo en parámetros decorados.

### Inyección de email provider

Similar patrón en `infrastructure/email/`:

```typescript
@Inject(MAIL_PROVIDER) private readonly mail: IMailProvider
```

Implementación actual: `ResendMailProvider`. Cambiar a otro provider (SendGrid, AWS SES) requiere cambiar solo la implementación, no los call sites.

---

## Patrones de autorización

### Decoradores compuestos

`common/decorators/secure-endpoint.decorator.ts` expone:

- `@SecureAuthEndpoint()` — JwtAuthGuard + ApiBearerAuth + 401/403 docs.
- `@SecureOwnershipEndpoint(paramName)` — lo anterior + OwnershipGuard.

Uso típico:

```typescript
@Get(':id')
@SecureAuthEndpoint()
async getById(@Param('id') id: string, @CurrentUser() userId: string) { ... }

@Patch(':id')
@SecureOwnershipEndpoint('id')   // verifica que userId del JWT es dueño del recurso :id
async update(@Param('id') id: string, @Body() dto: UpdateDto) { ... }
```

### Validación de existencia

`@ValidateResourceExists(EntityClass, paramName)` lanza 404 antes de llegar al handler si el recurso no existe en DB.

```typescript
@Patch(':id')
@ValidateResourceExists(LicitacionEntity, 'id')
async update(@Param('id') id: string, @Body() dto: UpdateDto) {
  // Aquí ya sabemos que licitación con :id existe.
}
```

### Roles

```typescript
@Post()
@RequireRoles(Role.SUPER_ADMIN)     // solo super admin
@RequireRoles(Role.ORG_OWNER, Role.ORG_MEMBER)  // cualquiera de estos
async create() { ... }
```

---

## Patrones de configuración

### env.schema.ts + env.config.ts

`config/env.schema.ts` define la spec de TODAS las variables de entorno:

```typescript
{ name: 'JWT_SECRET', required: true, validate: (v) => v.length < 32 ? 'too short' : null }
```

`validateEnv(process.env)` se ejecuta al boot y lanza si algo falla. **Fail-fast**: si una env var crítica falta, NestJS no arranca.

`config/env.config.ts` exporta `config.X` tipado y validado. Resto del código usa `config.jwtSecret` en lugar de `process.env.JWT_SECRET` directamente.

---

## Decisiones de diseño

### Por qué TypeORM y no Prisma

- El repo se heredó con TypeORM ya en uso.
- TypeORM permite migrations versionadas con código TS (vs Prisma que usa DSL propio).
- Decisión revisable en Fase 3+.

### Por qué Redis cliente único `@Global()`

- Múltiples servicios necesitan Redis (BruteForce, RateLimit, RefreshTokenBlacklist).
- Un cliente único reduce conexiones simultáneas y unifica error handling.
- Implementación en `infrastructure/redis/redis.module.ts` (Sprint 1.5).

### Por qué blacklist de refresh tokens en Redis

- En memoria → no escala a múltiples instancias.
- En Postgres → cada validación de refresh = round trip a DB.
- En Redis → O(1) check, TTL automático cuando expira el token.

### Por qué `@nestjs/terminus` para health

- Estándar de la comunidad NestJS.
- Implementa el formato esperado por orquestadores (K8s, ECS).
- Soporta indicators built-in para TypeORM, MongoDB, microservices, etc.

### Por qué synchronize: false siempre

- Las migrations son la fuente de verdad del schema.
- `synchronize: true` en TypeORM auto-aplica cambios del código a la BD → peligroso en producción.

---

## Limitaciones conocidas (deuda registrada para Fase 2)

1. **Modelo User → Organization es many-to-one directo.** Un usuario pertenece a UNA organización. Multi-tenant verdadero requiere `MembershipEntity` (user_id, org_id, role). Pospuesto a Fase 2.1.

2. **DTOs en class-validator, no Zod.** Las validaciones del backend usan `class-validator`. El frontend usa Zod. Sin schemas compartidos. Pospuesto a Fase 2.1 (junto con rediseño User/Org).

3. **Tests con cobertura baja (~10%).** Solo `AuthService` y `BruteForceService` tienen tests unitarios. Resto sin tests. Pospuesto a Fase 2 / pre-producción.

4. **Algunos `any` residuales en controllers.** Patrón `@Request() req: any → const userId = req.user.id`. Hay decorador `@CurrentUser()` ya creado para reemplazarlo. Trabajo pendiente.

5. **Branding "LicitApp" residual** en plantillas de email, Swagger, etc. Cambiar a "SmartPliegos" en Fase 5 cuando se compre el dominio.