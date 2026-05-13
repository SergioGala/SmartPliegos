# Sprint 1.5 — Cliente Redis unificado

**Para:** 1 dev (paralelizable con 1.6 y 1.7)
**Branching:** todos en `main`. Sin feature branches. Sin PRs.
**Duración estimada:** 3-4 días naturales
**Sprint anterior:** 1.4 (Zod)
**Sprint siguiente:** 1.6 (seguridad scraping) o 1.7 (CI/CD)

---

## 1. Contexto y objetivo

Hoy hay servicios en el backend que crean **su propio cliente Redis** independiente:

- `BruteForceService` instancia su `redisClient`.
- `RateLimitService` instancia el suyo.
- (potencialmente otros).

Cada servicio llama a `createClient(...)` con su URL, abre su conexión, gestiona reconexión a su modo. Eso causa:

- **3 conexiones a Redis cuando 1 basta.** Desperdicio de slots de conexión (Redis tiene un límite por defecto de ~10k pero las connections son recurso).
- **Lógica duplicada de reconexión, error handling.** Si un servicio lo hace bien y el otro mal, hay bugs solo en uno.
- **Imposible mockear Redis en tests** sin tocar cada servicio uno a uno.

Hay además un problema de seguridad concreto: la **blacklist de refresh tokens** (`AuthService`) usa un `Set` en memoria. Si el backend reinicia, los tokens "blacklisteados" vuelven a ser válidos. Lo solucionamos en este sprint moviéndolo a Redis con TTL.

**Después de este sprint:**

- Existe un único `RedisModule` global que provee un cliente Redis singleton inyectable.
- `BruteForceService`, `RateLimitService`, etc., dejan de crear su cliente. Inyectan el del módulo.
- La blacklist de refresh tokens migra a Redis con TTL automático.
- Tests unitarios pueden mockear el cliente con un `RedisMock`.

> **Por qué este sprint es paralelizable:** toca solo `apps/backend/src/infrastructure/redis/`, `BruteForceService`, `RateLimitService` y `AuthService`. NO toca módulos de licitaciones, alerts, scraping, ni el frontend.

---

## 2. Glosario

- **Singleton:** una única instancia compartida en toda la app. NestJS provides son singleton por defecto.
- **TTL (Time To Live):** segundos tras los cuales una clave de Redis se borra automáticamente. Útil para sesiones, blacklists, caches.
- **Token JWT blacklist:** lista de tokens que han sido revocados manualmente (logout) y deben rechazarse aunque la firma sea válida.
- **`forRootAsync`:** patrón de NestJS para registrar un módulo cuya configuración depende de otras dependencias (ej. `ConfigService`).

---

## 3. Setup inicial

```powershell
cd C:\Users\Usuario\Desktop\factum
git checkout main
git pull --rebase origin main
npm install
npm run build -w backend
```

---

## 4. Punto 1.5.1 — Crear `RedisModule`

### 4.1 Crear interfaz y token DI

**Crear archivo:** `apps/backend/src/infrastructure/redis/redis.tokens.ts`

```typescript
/**
 * Token DI para inyectar el cliente Redis singleton.
 *
 * Uso:
 *   constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClientType) {}
 */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
```

### 4.2 Crear el módulo

**Crear archivo:** `apps/backend/src/infrastructure/redis/redis.module.ts`

```typescript
import { Module, Global, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { REDIS_CLIENT } from './redis.tokens';

/**
 * Módulo global de Redis.
 *
 * Crea UN único cliente Redis y lo provee al inyectarlo donde se necesite.
 * El cliente se conecta al arrancar la app y se desconecta al cerrar.
 *
 * @Global() significa que cualquier módulo en la app puede inyectar
 * REDIS_CLIENT sin tener que hacer imports: [RedisModule] en sus
 * propios módulos.
 *
 * Configuración requerida en .env:
 *   - REDIS_URL: url completa, ej. redis://localhost:6379
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<RedisClientType> => {
        const logger = new Logger('RedisModule');
        const url = configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

        const client: RedisClientType = createClient({ url });

        client.on('error', (err) => {
          logger.error(`Redis client error: ${err.message}`);
        });

        client.on('connect', () => {
          logger.log(`Connected to Redis: ${url}`);
        });

        client.on('disconnect', () => {
          logger.warn('Disconnected from Redis');
        });

        await client.connect();
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  /**
   * Hook de NestJS que se ejecuta cuando la app cierra.
   * Cerramos el cliente para que no queden conexiones colgadas.
   */
  async onModuleDestroy(): Promise<void> {
    // Si hubiera múltiples instancias (no en este caso), las cerraríamos aquí.
    // Como el provider es singleton, NestJS ya gestiona la limpieza
    // por nosotros si tuvieras un Provider class-based con métodos OnDestroy.
    // Para useFactory + cliente Redis externo, conviene cerrar manualmente:
  }
}
```

> **Sobre `OnModuleDestroy`:** la implementación robusta requiere acceder al cliente desde el módulo para cerrarlo. Si quieres ese cleanup, conviértelo en un provider class-based (`RedisService`) y deja `REDIS_CLIENT` apuntando a su método `getClient()`. Para este sprint la versión simple es suficiente.

### 4.3 Registrar el módulo en `AppModule`

Editar `apps/backend/src/app.module.ts`:

```typescript
import { RedisModule } from './infrastructure/redis/redis.module';

@Module({
  imports: [
    // ... otros módulos
    RedisModule,
    // ...
  ],
})
export class AppModule {}
```

### 4.4 Crear barrel

**Crear archivo:** `apps/backend/src/infrastructure/redis/index.ts`

```typescript
export { RedisModule } from './redis.module';
export { REDIS_CLIENT } from './redis.tokens';
export type { RedisClientType } from 'redis';
```

### 4.5 Verificar

```powershell
cd apps\backend
npm run build
npm run start:dev
```

En logs debe aparecer:

```
[Nest] LOG [RedisModule] Connected to Redis: redis://localhost:6379
```

Si no aparece o aparece el error de conexión, verificar que Docker tiene Redis levantado:

```powershell
docker ps | findstr redis
```

### 4.6 Commit

```powershell
git add .
git commit -m "feat(infra): add global RedisModule with singleton client

- Single Redis connection shared across the app
- @Global() so consumers don't need to import RedisModule explicitly
- REDIS_CLIENT token (Symbol) for type-safe injection
- Connection lifecycle logged

Sprint 1.5.1"
git push origin main
```

---

## 5. Punto 1.5.2 — Refactor de `BruteForceService`

### 5.1 Estado actual

El `BruteForceService` actual probablemente tiene algo así:

```typescript
@Injectable()
export class BruteForceService implements OnModuleInit {
  private redisClient: RedisClientType;

  async onModuleInit() {
    this.redisClient = createClient({ url: process.env.REDIS_URL });
    await this.redisClient.connect();
  }

  async recordFailedAttempt(ip: string) {
    await this.redisClient.incr(`brute:${ip}`);
    // ...
  }
}
```

### 5.2 Refactor a inyección

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT, RedisClientType } from '../../../infrastructure/redis';

@Injectable()
export class BruteForceService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  async recordFailedAttempt(ip: string): Promise<void> {
    await this.redisClient.incr(`brute:${ip}`);
    // El TTL solo se aplica en la primera escritura, así que:
    await this.redisClient.expire(`brute:${ip}`, 900); // 15 min
  }

  async getFailedAttempts(ip: string): Promise<number> {
    const value = await this.redisClient.get(`brute:${ip}`);
    return value ? parseInt(value, 10) : 0;
  }

  async resetAttempts(ip: string): Promise<void> {
    await this.redisClient.del(`brute:${ip}`);
  }

  async isIpBlocked(ip: string, threshold: number): Promise<boolean> {
    const attempts = await this.getFailedAttempts(ip);
    return attempts >= threshold;
  }
}
```

> **Cambios clave:**
> - Eliminado `OnModuleInit` y `onModuleInit()`. El cliente ya está conectado por el `RedisModule` global.
> - Eliminado `private redisClient: RedisClientType` privado y la línea de `createClient`.
> - Inyectado vía constructor con `@Inject(REDIS_CLIENT)`.

### 5.3 Verificar que funciona

```powershell
npm run build -w backend
npm run start:dev -w backend
```

Test manual: hacer 5 intentos fallidos de login y verificar que el 6º se bloquea con error de brute force.

### 5.4 Commit

```powershell
git add .
git commit -m "refactor(auth): inject shared Redis client in BruteForceService

- Remove per-service Redis connection
- Use global REDIS_CLIENT from RedisModule
- Cleaner constructor, no OnModuleInit needed

Sprint 1.5.2"
git push origin main
```

---

## 6. Punto 1.5.3 — Refactor de `RateLimitService`

Aplicar el mismo patrón que `BruteForceService`. Eliminar la creación local de cliente, inyectar `REDIS_CLIENT`.

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT, RedisClientType } from '../../../infrastructure/redis';

@Injectable()
export class RateLimitService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  async incrementCounter(key: string, windowSeconds: number): Promise<number> {
    const count = await this.redisClient.incr(key);
    if (count === 1) {
      await this.redisClient.expire(key, windowSeconds);
    }
    return count;
  }

  async getCounter(key: string): Promise<number> {
    const value = await this.redisClient.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  async getTtl(key: string): Promise<number> {
    return await this.redisClient.ttl(key);
  }
}
```

Verificar:

```powershell
npm run build -w backend
npm run start:dev -w backend
```

Test manual: hacer múltiples requests al mismo endpoint y verificar que el header `X-RateLimit-Remaining` decrementa.

Commit (con mensaje similar al anterior pero adaptado).

---

## 7. Punto 1.5.4 — Migrar blacklist de refresh tokens a Redis

### 7.1 Estado actual del problema

En `auth.service.ts`, probablemente hay algo así:

```typescript
private blacklistedTokens = new Set<string>();

async logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  this.blacklistedTokens.add(tokenHash);
}

async isTokenBlacklisted(refreshToken: string): Promise<boolean> {
  const tokenHash = hashToken(refreshToken);
  return this.blacklistedTokens.has(tokenHash);
}
```

**Problema:** `Set` en memoria. Si el backend reinicia (deploy, crash), la blacklist se pierde. Tokens que el usuario "logout" pasan a ser válidos otra vez.

### 7.2 Refactor a Redis

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT, RedisClientType } from '../../infrastructure/redis';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
    // ... otros injects
  ) {}

  /**
   * Marca un refresh token como inválido.
   *
   * Usamos hash del token (no el token plano) porque si Redis se compromete,
   * los tokens en su clear text serían reusables. El hash es one-way.
   *
   * El TTL es la expiración natural del refresh token. Después de ese tiempo,
   * Redis borra la entrada automáticamente, manteniendo memoria limpia.
   *
   * @param refreshToken token a invalidar
   * @param expiresInSeconds segundos hasta que el token expire naturalmente
   */
  async blacklistRefreshToken(
    refreshToken: string,
    expiresInSeconds: number,
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const key = `refresh:blacklist:${tokenHash}`;
    await this.redisClient.set(key, '1', { EX: expiresInSeconds });
  }

  async isRefreshTokenBlacklisted(refreshToken: string): Promise<boolean> {
    const tokenHash = this.hashToken(refreshToken);
    const key = `refresh:blacklist:${tokenHash}`;
    const value = await this.redisClient.get(key);
    return value !== null;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
```

### 7.3 Eliminar el Set en memoria

Buscar y eliminar:

```typescript
private blacklistedTokens = new Set<string>();
```

Y todos los `this.blacklistedTokens.add(...)` y `this.blacklistedTokens.has(...)` ahora usan los métodos nuevos.

### 7.4 Verificar

Test manual:
1. Login → recibes refresh token.
2. Logout → backend lo marca en Redis.
3. Inspeccionar Redis: `docker exec -it smartpliegos-redis redis-cli` → `KEYS refresh:blacklist:*` debe mostrar 1+ keys.
4. Reiniciar el backend.
5. Intentar usar el refresh token revocado → debe fallar (porque sigue en Redis).

### 7.5 Commit

```powershell
git add .
git commit -m "feat(auth): persist refresh-token blacklist in Redis

- Replace in-memory Set with Redis SET key (sha256 of token)
- TTL matches natural token expiration (auto-cleanup)
- Survives backend restarts (no more re-validatable revoked tokens)
- Hashed storage so a Redis compromise doesn't leak token plain text

Sprint 1.5.4"
git push origin main
```

---

## 8. Verificación final

```powershell
cd C:\Users\Usuario\Desktop\factum
npm run build -w backend
npm run lint -w backend
npm test -w backend
npm run start:dev -w backend
```

Smoke test:
- [ ] Logs arrancan con `Connected to Redis: redis://...` (UNA sola vez, no varias).
- [ ] Login funciona.
- [ ] Brute force tras 5 fallos bloquea.
- [ ] Rate limit decrementa con cada request.
- [ ] Logout + reinicio backend + intento usar refresh viejo → falla.
- [ ] `docker exec -it smartpliegos-redis redis-cli` → `INFO clients` muestra `connected_clients:1` (no 3 como antes).

### 8.1 Tag y cierre

```powershell
git tag -a sprint-1.5-closed -m "Sprint 1.5 closed: unified Redis client"
git push origin sprint-1.5-closed
```

**Anuncio en Slack:**

```
🎉 Sprint 1.5 cerrado · main estable
Redis unificado: 1 conexión en lugar de 3. Blacklist de refresh tokens persistente.

@equipo: para nuevas funcionalidades que necesiten Redis (cache, locks, queues),
  inyectar @Inject(REDIS_CLIENT) private readonly redis: RedisClientType
  desde 'src/infrastructure/redis'.
```

---

## 9. Debug

| Síntoma | Causa | Fix |
|---|---|---|
| `Cannot inject REDIS_CLIENT` | RedisModule no registrado en AppModule, o no es @Global() | Verificar paso 4.3 |
| Logs muestran `Connected to Redis` 2-3 veces | Algún servicio aún crea su cliente | `git grep "createClient" apps/backend/src` |
| Tras reiniciar backend, brute force counter se resetea | El servicio aún usa memoria local | Verificar refactor del paso 5.2 |
| `redisClient.set` con `{ EX: ... }` da error de tipos | Versión vieja del cliente Redis | `npm install redis@^4.7.0 -w backend` |
| Logout + reinicio + reuso del token → funciona (no debería) | Cambio del Set no completo, queda lógica vieja en algún path | Buscar todos los usos del Set y migrar |

---

## 10. Lo que se queda fuera

- Pub/Sub de Redis para eventos. Llegará en Fase 4-5 cuando haya queues de IA.
- Locks distribuidos (Redlock). Cuando aparezca caso de uso real.
- Migrar caches de NestJS a Redis (si los hay). Sprint aparte si surge.
- Health check específico de Redis en `/health`. Sprint 1.7.

---

*Sprint 1.5 v1.0 · SmartPliegos · 1 dev · Trabajo en `main`*
