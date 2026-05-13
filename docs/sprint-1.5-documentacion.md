# Sprint 1.5 — Cliente Redis Unificado
## Documentación técnica de cambios

**Fecha:** Mayo 2026
**Repo:** SmartPliegos (backend NestJS)
**Dev:** Giovanny (JEG Studio)

---

## Problema que existía antes del sprint

El backend tenía **3 conexiones independientes a Redis** abiertas simultáneamente:

| Servicio | Cómo conectaba | Problema |
|----------|---------------|---------|
| `BruteForceService` | `createClient()` en constructor + `initializeRedis()` privado | Conexión propia, reconexión propia, error handling propio |
| `RateLimitService` | `createClient()` en constructor + `initializeRedis()` privado | Igual que arriba, código duplicado |
| `AuthService` | No usaba Redis — usaba `Set<string>` en memoria | La blacklist de tokens se perdía al reiniciar el backend |

**Consecuencias concretas:**
- 3 slots de conexión usados donde 1 era suficiente
- Si Redis caía, cada servicio manejaba el error a su manera (inconsistente)
- Imposible mockear Redis en tests sin parchear cada servicio individualmente
- **Bug de seguridad:** hacer logout y reiniciar el backend dejaba el refresh token revocado como válido de nuevo

---

## Qué se cambió y por qué

### Cambio 1 — Nuevo `RedisModule` global

**Archivos creados:**
```
apps/backend/src/infrastructure/redis/
├── redis.module.ts    → Módulo NestJS @Global con el cliente singleton
├── redis.tokens.ts    → Token DI (Symbol) para inyección type-safe
└── index.ts           → Barrel export
```

**Archivo eliminado:**
```
apps/backend/src/infrastructure/redis.module.ts  → estaba vacío, eliminado para evitar colisión
```

**Por qué `@Global()`:** con este decorador, cualquier módulo de la app puede inyectar `REDIS_CLIENT` sin tener que importar `RedisModule` explícitamente en su propio módulo. Una sola vez en `AppModule` y listo.

**Por qué `Symbol` para el token:** evita colisiones de nombre con strings. Si dos módulos definen `'REDIS_CLIENT'` como string, NestJS no puede distinguirlos. Un `Symbol` es único por definición.

**Registro en AppModule:**
```typescript
// apps/backend/src/app.module.ts
import { RedisModule } from './infrastructure/redis';

@Module({
  imports: [
    // ...resto de módulos
    RedisModule,
  ],
})
export class AppModule {}
```

---

### Cambio 2 — Refactor de `BruteForceService`

**Archivo:** `apps/backend/src/common/services/brute-force.service.ts`

**Antes:**
```typescript
// Creaba su propio cliente Redis
@Injectable()
export class BruteForceService {
  private redisClient: RedisClientType;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis(); // conexión propia
  }

  private async initializeRedis(): Promise<void> {
    this.redisClient = createClient({ url: redisUrl, socket: { reconnectStrategy: ... } });
    await this.redisClient.connect();
  }
}
```

**Después:**
```typescript
// Inyecta el cliente del RedisModule global
@Injectable()
export class BruteForceService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}
  // Sin initializeRedis, sin isConnected, sin createClient
}
```

**Qué se eliminó:**
- `private redisClient: RedisClientType` (campo privado)
- `private isConnected = false` (flag de estado)
- `private async initializeRedis()` (método completo)
- Import de `createClient` y `ConfigService`
- Toda la lógica de reconexión duplicada
- Método `disconnect()` (el módulo global gestiona el ciclo de vida)

**Nota sobre `import type`:** TypeScript con `isolatedModules` + `emitDecoratorMetadata` requiere que los tipos usados en parámetros decorados se importen con `import type`. Por eso:
```typescript
import type { RedisClientType } from 'redis'; // correcto
import { RedisClientType } from 'redis';       // error de build
```

---

### Cambio 3 — Refactor de `RateLimitService`

**Archivo:** `apps/backend/src/common/services/rate-limit.service.ts`

Mismo patrón que `BruteForceService`. Se eliminó:
- `private async initializeRedis()` completo
- `private isConnected = false`
- `private redisClient: RedisClientType`
- Import de `createClient` y `ConfigService`
- Método `disconnect()`

Se mantuvo toda la lógica de negocio (`isAllowed`, `resetCounter`, `getInfo`, `generateKey`) intacta, solo cambia de dónde viene el cliente Redis.

---

### Cambio 4 — Blacklist de refresh tokens migrada a Redis

**Archivo:** `apps/backend/src/modules/auth/auth.service.ts`

**Antes — bug de seguridad:**
```typescript
// Set en memoria — se pierde al reiniciar
private readonly invalidatedTokens = new Set<string>();

async logout(refresh_token: string) {
  this.invalidatedTokens.add(refresh_token); // solo en RAM
}

async refreshToken(dto: RefreshTokenDto) {
  if (this.invalidatedTokens.has(refresh_token)) { // solo en RAM
    throw new UnauthorizedException('...');
  }
}
```

**Escenario de ataque posible con el bug:**
1. Usuario hace logout → token entra al Set en memoria
2. Backend se reinicia (deploy, crash)
3. El Set se vacía — token vuelve a ser "válido"
4. Atacante que interceptó el token puede usarlo

**Después — persistente en Redis:**
```typescript
// Redis con TTL automático — sobrevive reinicios
async logout(refresh_token: string): Promise<{ message: string }> {
  const tokenHash = this.hashToken(refresh_token);
  const key = `refresh:blacklist:${tokenHash}`;
  await this.redisClient.set(key, '1', { EX: this.REFRESH_TOKEN_EXPIRY });
  // TTL = 7 días (vida natural del refresh token)
  // Redis borra la entrada automáticamente cuando expira
}

private async isRefreshTokenBlacklisted(token: string): Promise<boolean> {
  const key = `refresh:blacklist:${this.hashToken(token)}`;
  const value = await this.redisClient.get(key);
  return value !== null;
}

private hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
```

**Por qué se hashea el token:** si Redis se ve comprometido, un atacante no obtiene los tokens en texto plano (que podría reusar). El hash SHA256 es one-way — no se puede revertir al token original.

**Por qué TTL = `REFRESH_TOKEN_EXPIRY` (7 días):** después de 7 días el token expiraría de todas formas (firma JWT inválida), así que la entrada en Redis ya no tiene utilidad. Redis la borra automáticamente, manteniendo la memoria limpia sin necesidad de un job de limpieza.

---

## Resultado después del sprint

**Logs al arrancar (antes):**
```
[RedisModule] Connected to Redis: redis://localhost:6379      ← conexión 1
[BruteForceService] ✅ Redis conectado para Brute Force Protection  ← conexión 2
[RateLimitService] ✅ Redis conectado para Rate Limiting            ← conexión 3
```

**Logs al arrancar (después):**
```
[RedisModule] Connected to Redis: redis://localhost:6379      ← solo 1 conexión ✅
```

**Verificar en Redis:**
```bash
docker exec -it licitaapp-redis redis-cli
INFO clients
# connected_clients: 1  (antes era 3)

# Verificar blacklist tras logout:
KEYS refresh:blacklist:*
# muestra las entradas con TTL automático
```

---

## Patrón para futuros módulos

Cualquier módulo nuevo que necesite Redis debe seguir este patrón:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../../infrastructure/redis';
import type { RedisClientType } from 'redis';

@Injectable()
export class MiNuevoServicio {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  async miMetodo(): Promise<void> {
    await this.redisClient.set('clave', 'valor', { EX: 3600 });
  }
}
```

**No crear nunca:**
```typescript
// ❌ MAL — no hacer esto
private redisClient = createClient({ url: process.env.REDIS_URL });
```

---

## Checklist de verificación post-sprint

- [x] Build limpio (`npm run build`)
- [x] Un solo log `Connected to Redis` al arrancar
- [x] `BruteForceService` sin `createClient` ni `initializeRedis`
- [x] `RateLimitService` sin `createClient` ni `initializeRedis`
- [x] `AuthService` sin `invalidatedTokens = new Set()`
- [x] Logout persiste en Redis tras reinicio del backend
- [ ] `docker exec -it licitaapp-redis redis-cli INFO clients` → `connected_clients:1`
- [ ] Test manual: 5 fallos de login → bloqueo por brute force
- [ ] Test manual: logout + reinicio + refresh token revocado → falla

---

*Sprint 1.5 cerrado · SmartPliegos · JEG Studio*
