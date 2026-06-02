

SPRINT CERRADO

# Carril CRUDs (C1) — Manual CLICK A CLICK

> Lo abro con la verdad por delante: dentro hay **cuatro agujeros de seguridad** que vamos a cerrar primero (tarea 1). Después, los pulidos visibles: borrar cuenta (tarea 2) y la tab Organización con miembros e invitaciones (tarea 3, la gorda). Mismo formato que C3: archivo + línea + copia y pega.

---

## Parte 0 — Antes de nada

`git status` debe estar limpio. Si tienes cosas pendientes, commitea o descarta. Trabajamos en `main` igual que C3.

```
git status        # tree clean
git pull
```

Y la regla de oro: **commit antes de cada tarea** para tener `git reset --hard HEAD~1` como botón de pánico.

---

# 🔥 TAREA 1 — Cerrar 4 agujeros de seguridad (5 minutos, va PRIMERO)

**Qué hay roto**: el schema de Zod `updateUserSchema` que valida `PATCH /users/:userId` permite que el usuario mande estos campos en el body — y como `SecureOwnershipEndpoint` solo comprueba que el `:userId` de la URL coincida con el JWT, **el usuario se aplica los cambios a sí mismo sin más control**:

- `role` → un usuario normal puede mandar `{ "role": "SUPER_ADMIN" }` y se hace admin él solo.
- `userPlan` → cambiarse el plan a PRO sin pagar.
- `isActive` → activar una cuenta desactivada por el admin.
- `email` → cambiar el email sin verificación (suplantación: si te roban el token, te cambian el email y te bloquean fuera).

**Cómo se cierra**: borrar esos cuatro campos del schema. Esos campos solo deben tocarse desde endpoints específicos de admin (que ya existen: `POST /users/:userId/activate`, `deactivate`, etc.).

### Paso 1.1 — Editar el schema

Abre `apps/backend/src/modules/users/dto/update-user.dto.ts`. `Ctrl+G` → línea `6`. Verás el bloque:

```ts
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  firstName: z.string().trim().min(1, 'firstName cannot be empty').optional(),
  lastName: z.string().trim().min(1, 'lastName cannot be empty').optional(),
  phone: optionalPhoneSchema,
  timezone: optionalTimezoneSchema,
  role: z.nativeEnum(Role).optional(),
  userPlan: z.nativeEnum(Plan).optional(),
  isActive: z.boolean().optional(),
});
```

Reemplázalo **entero** por esto (deja solo lo que el usuario sí debe poder cambiar de su propio perfil):

```ts
export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1, 'firstName cannot be empty').optional(),
  lastName: z.string().trim().min(1, 'lastName cannot be empty').optional(),
  phone: optionalPhoneSchema,
  timezone: optionalTimezoneSchema,
});
```

`Ctrl+S`. Si los imports de `Role` o `Plan` en la línea 4 se quedan en gris (sin usar), bórralos.

### Paso 1.2 — Limpiar la clase Swagger (cosmético, mismo archivo)

Sigue en `update-user.dto.ts`. Borra todas las `@ApiPropertyOptional` de los campos que acabamos de quitar (`email`, `role`, `userPlan`, `isActive`) dentro de `UpdateUserDtoSwagger`. Si no lo haces no rompe nada, pero Swagger seguirá mintiendo diciendo que esos campos se aceptan.

### Paso 1.3 — Verificar

Lanza:
```
npm run lint -w backend
npm test -w backend
```

Los tests del `update-user.dto.spec.ts` pueden quejarse de que probaban casos con `email` o `role` que ahora ya no aplican. Si revienta alguno, ábrelo y borra los `it(...)` de los campos que ya no existen. Es lo único que ese cambio puede romper.

### Paso 1.4 — Commit

```
git add -A && git commit -m "fix(users): cerrar escalada de privilegios en PATCH /users/:userId"
```

---

# TAREA 2 — Borrar cuenta (15 minutos)

**Qué consigues**: en la tab "Seguridad" aparece una sección "Zona peligrosa" con un botón rojo "Borrar mi cuenta". Pulsas → diálogo de confirmación → si confirmas, se llama al backend, se hace logout y vuelves al login.

### Paso 2.1 — Añadir `deleteUser` al `usersApi`

Abre `apps/frontend/src/features/users/api/users.api.ts`. Dentro del objeto `usersApi`, al final (después de `confirmPasswordReset`), añade este método:

```ts
  /**
   * DELETE /users/:userId
   * Borra la cuenta del usuario autenticado. Ownership requerido.
   */
  async deleteUser(userId: string): Promise<void> {
    await apiDelete<void>(`/users/${userId}`);
  },
```

Asegúrate de que en el import de arriba (línea 1) está `apiDelete`:

```ts
import { apiPatch, apiPost, apiGet, apiDelete } from '@/lib/api-client';
```

`Ctrl+S`.

### Paso 2.2 — Localizar el logout

Lo necesitamos para llamarlo tras borrar. Lanza en la terminal del proyecto:

```
grep -rnE "logout|signOut" apps/frontend/src/stores --include=*.ts
```

Verás algo tipo `auth-store.ts` con un método `logout`. Apunta cómo se importa. Suele ser:

```ts
import { useAuthStore } from '@/stores/auth-store';
// y dentro del componente:
const logout = useAuthStore((s) => s.logout);
```

> Si en tu repo se llama distinto (signOut, cerrarSesion…), úsalo. El nombre da igual, lo importante es que llame al endpoint de logout del back y limpie el token del store.

### Paso 2.3 — Añadir la sección "Zona peligrosa" en la tab Seguridad

Abre `apps/frontend/src/features/users/pages/ajustes-seguridad-tab.tsx`. Hay que añadir un nuevo bloque al final del JSX (debajo del formulario de contraseña). Y antes de eso, los hooks y el handler.

**Imports** — al principio del archivo, añade los que falten:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { usersApi } from '@/features/users/api/users.api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
```

**Hooks y handler** — dentro del componente `AjustesSeguridadTab`, justo después del `useForm` que ya tiene, añade:

```tsx
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await usersApi.deleteUser(user.id);
      toast.success(t('settings:security.deleteAccount.success'));
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(t('settings:security.deleteAccount.error'));
      } else {
        toast.error(t('common:errors.network', ''));
      }
      setIsDeleting(false);
    }
  };
```

**JSX nuevo** — busca el cierre del `<form>` (el `</form>` que cierra el form de contraseña). Justo **DESPUÉS** del `</form>` y dentro del `<div>` principal del componente, añade el bloque de "Zona peligrosa":

```tsx
        {/* Zona peligrosa */}
        <div className="mt-10 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <h3 className="text-base font-semibold text-destructive">
            {t('settings:security.dangerZone.title')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('settings:security.dangerZone.subtitle')}
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-4" disabled={isDeleting}>
                {isDeleting
                  ? t('settings:security.dangerZone.deleting')
                  : t('settings:security.dangerZone.button')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('settings:security.dangerZone.confirmTitle')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('settings:security.dangerZone.confirmDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t('common:cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('settings:security.dangerZone.confirmButton')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
```

`Ctrl+S`.

### Paso 2.4 — Traducciones

Abre `apps/frontend/src/i18n/locales/es/settings.json`. Busca el bloque `"security"` y, dentro, añade estas claves (cuida la coma final):

```json
    "deleteAccount": {
      "success": "Tu cuenta se ha borrado",
      "error": "No se pudo borrar la cuenta"
    },
    "dangerZone": {
      "title": "Zona peligrosa",
      "subtitle": "Borrar tu cuenta es permanente. Se eliminarán tus alertas, favoritos y datos asociados.",
      "button": "Borrar mi cuenta",
      "deleting": "Borrando...",
      "confirmTitle": "¿Borrar tu cuenta?",
      "confirmDescription": "Esta acción no se puede deshacer. Tu cuenta y todos sus datos se eliminarán permanentemente.",
      "confirmButton": "Sí, borrar mi cuenta"
    }
```

Repítelo en `en/settings.json`, `ca/settings.json`, `gl/settings.json`, `eu/settings.json` y `pt/settings.json` con las traducciones equivalentes. Si quieres ir rápido, pon el mismo texto en español en todos y te lo traducen los compañeros después.

### Paso 2.5 — Probar

1. Crea un usuario de prueba (no uses el principal).
2. Logueate con él, vete a Ajustes → Seguridad.
3. Pulsa "Borrar mi cuenta" → diálogo → "Sí, borrar mi cuenta".
4. Debes volver al login con un toast verde "Tu cuenta se ha borrado".
5. Intenta logueate de nuevo con el mismo email → debe fallar.

### Paso 2.6 — Commit

```
git add -A && git commit -m "feat(users): borrar cuenta desde ajustes con confirmación"
```

---

# TAREA 3 — Organización con miembros e invitaciones (~1h)

**Qué consigues**: la tab "Organización" deja de ser un cartel y se convierte en gestión real: ves los miembros con su rol, y si eres `ORG_OWNER` puedes invitar gente por email y cancelar invitaciones pendientes. Si eres un miembro normal, solo ves la lista.

Vamos por partes: primero las APIs (3.1 y 3.2), luego la tab nueva entera (3.3).

### Paso 3.1 — Crear `invitationsApi` (no existe)

Crea el archivo `apps/frontend/src/features/users/api/invitations.api.ts` con esto:

```ts
import { apiPost, apiGet, apiDelete } from '@/lib/api-client';

export interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
}

export interface CreateInvitationPayload {
  email: string;
  organizationId: string;
}

export const invitationsApi = {
  /** POST /invitations — solo ORG_OWNER */
  async create(payload: CreateInvitationPayload): Promise<Invitation> {
    return apiPost<Invitation, CreateInvitationPayload>('/invitations', payload);
  },

  /** GET /invitations/organization/:organizationId — lista todas las invitaciones de una org */
  async listByOrganization(organizationId: string): Promise<Invitation[]> {
    return apiGet<Invitation[]>(`/invitations/organization/${organizationId}`);
  },

  /** DELETE /invitations/:id — cancela una invitación pendiente */
  async cancel(invitationId: string): Promise<void> {
    await apiDelete<void>(`/invitations/${invitationId}`);
  },
};
```

`Ctrl+S`.

### Paso 3.2 — Añadir `listByOrganization` al `usersApi`

Abre `apps/frontend/src/features/users/api/users.api.ts` y añade dentro de `usersApi`:

```ts
  /**
   * GET /users/organization/:organizationId
   * Lista los usuarios miembros de una organización.
   */
  async listByOrganization(organizationId: string): Promise<AuthUser[]> {
    return apiGet<AuthUser[]>(`/users/organization/${organizationId}`);
  },
```

### Paso 3.3 — Reescribir la tab Organización

Abre `apps/frontend/src/features/users/pages/ajustes-organizacion-tab.tsx`. Las 54 líneas actuales son solo lectura del plan; **lo borramos casi todo y empezamos de cero** con cuatro secciones: info del plan, lista de miembros, invitaciones pendientes (si owner), invitar (si owner).

Reemplaza el archivo **entero** por este:

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Building2, UserPlus, X, Mail } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { usersApi } from '@/features/users/api/users.api';
import { invitationsApi } from '@/features/users/api/invitations.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface InviteFormData {
  email: string;
}

export function AjustesOrganizacionTab() {
  const { t } = useTranslation('settings');
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const isOwner = user?.role === 'ORG_OWNER' || user?.role === 'SUPER_ADMIN';
  const orgId = user?.organizationId;

  // Miembros
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => usersApi.listByOrganization(orgId!),
    enabled: !!orgId,
  });

  // Invitaciones (solo si soy owner)
  const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: ['org-invitations', orgId],
    queryFn: () => invitationsApi.listByOrganization(orgId!),
    enabled: !!orgId && isOwner,
  });

  // Invitar
  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<InviteFormData>({ mode: 'onSubmit' });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormData) =>
      invitationsApi.create({ email: data.email, organizationId: orgId! }),
    onSuccess: () => {
      toast.success(t('organization.invite.success'));
      reset();
      queryClient.invalidateQueries({ queryKey: ['org-invitations', orgId] });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          toast.error(t('organization.invite.errors.alreadyExists'));
        } else if (error.response?.status === 403) {
          toast.error(t('organization.invite.errors.forbidden'));
        } else {
          toast.error(t('organization.invite.errors.generic'));
        }
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.cancel(id),
    onSuccess: () => {
      toast.success(t('organization.invitations.cancelled'));
      queryClient.invalidateQueries({ queryKey: ['org-invitations', orgId] });
    },
    onError: () => toast.error(t('common:errors.generic')),
  });

  if (!user) {
    return <div className="text-sm text-muted-foreground">{t('common:status.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('organization.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('organization.subtitle')}</p>
      </div>

      {/* Plan info */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Building2 className="size-5 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('organization.planLabel')}</div>
            <div className="text-base font-medium">{user.userPlan ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Miembros */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium mb-3">{t('organization.members.title')}</h3>
        {loadingMembers ? (
          <div className="text-sm text-muted-foreground">{t('common:status.loading')}</div>
        ) : members.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t('organization.members.empty')}</div>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-1.5">
                <div>
                  <div className="text-sm font-medium">
                    {m.firstName} {m.lastName}
                    {m.id === user.id && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({t('organization.members.you')})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </div>
                <Badge variant="outline" className="text-xs">{m.role}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invitaciones pendientes (solo owner) */}
      {isOwner && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium mb-3">{t('organization.invitations.title')}</h3>
          {loadingInvitations ? (
            <div className="text-sm text-muted-foreground">{t('common:status.loading')}</div>
          ) : invitations.filter((i) => i.status === 'PENDING').length === 0 ? (
            <div className="text-sm text-muted-foreground">{t('organization.invitations.empty')}</div>
          ) : (
            <ul className="space-y-2">
              {invitations
                .filter((i) => i.status === 'PENDING')
                .map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <Mail className="size-3.5 text-muted-foreground" />
                      <span className="text-sm">{inv.email}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelMutation.mutate(inv.id)}
                      disabled={cancelMutation.isPending}
                      aria-label={t('organization.invitations.cancel')}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {/* Invitar (solo owner) */}
      {isOwner && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium mb-1">{t('organization.invite.title')}</h3>
          <p className="text-xs text-muted-foreground mb-3">{t('organization.invite.subtitle')}</p>
          <form
            onSubmit={handleSubmit((data) => inviteMutation.mutate(data))}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <Input
              type="email"
              placeholder={t('organization.invite.emailPlaceholder')}
              {...register('email', { required: true })}
              className="flex-1"
            />
            <Button type="submit" disabled={inviteMutation.isPending}>
              <UserPlus className="size-4" />
              {inviteMutation.isPending
                ? t('organization.invite.sending')
                : t('organization.invite.send')}
            </Button>
          </form>
          {errors.email && (
            <p className="text-xs text-destructive mt-2">{t('organization.invite.errors.invalidEmail')}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

`Ctrl+S`. **No esperes que se vea perfecto**: faltan las traducciones que añadimos a continuación.

### Paso 3.4 — Traducciones

En `apps/frontend/src/i18n/locales/es/settings.json` busca el bloque `"organization"` y reemplázalo entero por:

```json
  "organization": {
    "title": "Organización",
    "subtitle": "Gestiona tu organización y sus miembros.",
    "planLabel": "Plan actual",
    "members": {
      "title": "Miembros",
      "empty": "No hay otros miembros en tu organización.",
      "you": "tú"
    },
    "invitations": {
      "title": "Invitaciones pendientes",
      "empty": "No hay invitaciones pendientes.",
      "cancel": "Cancelar invitación",
      "cancelled": "Invitación cancelada"
    },
    "invite": {
      "title": "Invitar a un nuevo miembro",
      "subtitle": "Le llegará un email con un enlace para unirse a tu organización.",
      "emailPlaceholder": "email@ejemplo.com",
      "send": "Enviar invitación",
      "sending": "Enviando...",
      "success": "Invitación enviada",
      "errors": {
        "invalidEmail": "Introduce un email válido",
        "alreadyExists": "Ya existe una invitación pendiente para ese email",
        "forbidden": "No tienes permiso para invitar",
        "generic": "No se pudo enviar la invitación"
      }
    }
  }
```

Réplica en los otros cinco locales (`en`, `ca`, `gl`, `eu`, `pt`). Si solo vas a probar en español, deja los demás con el texto en español temporalmente.

### Paso 3.5 — Probar

1. Logueate como `ORG_OWNER` (si tu seed no creó ninguno, hazlo desde Swagger o crea el usuario y promociónalo manualmente con un script — recuerda que tras la tarea 1 ya **NO** puedes promocionarte desde la UI).
2. Vete a Ajustes → Organización.
3. Verifica:
   - Se ve la card del plan.
   - Se ve la lista de miembros con tu nombre marcado como "(tú)".
   - Si eres owner, se ve la sección "Invitaciones pendientes" (vacía la primera vez) y "Invitar nuevo miembro".
4. Invita un email cualquiera → debe salir el toast verde y aparecer en la lista de pendientes.
5. Pulsa la X de la invitación → desaparece, toast "Invitación cancelada".
6. Loguéate como un usuario miembro normal (no owner) y verifica que la tab solo muestra plan + miembros, **sin** las dos secciones de owner.

### Paso 3.6 — Commit

```
git add -A && git commit -m "feat(users): tab Organización con miembros e invitaciones"
```

---

# Deuda apuntada (para sprints futuros)

Lo dejo aquí explícito para que no se pierda:

- **Flujo de cambio de email con verificación**. Hoy el back ni siquiera lo expone (gracias a la tarea 1), y el front no lo permite. Cuando se haga, necesita: migración nueva `email_change_requests`, endpoint POST request (manda email al NUEVO con token), endpoint POST confirm (valida y aplica), email template nuevo, UI en perfil-tab. Estimación: 3-4h.
- **Endpoint admin de cambio de rol/plan**. Hoy solo se puede activar/desactivar. Si haces algo que requiera promocionar a admin desde la UI, necesitas un endpoint dedicado con guard SUPER_ADMIN (no SecureOwnershipEndpoint).
- **Aceptar invitación**. El backend tiene `POST /invitations/:token/accept` pero no hay UI que reciba el link del email y lo procese. Cuando se mande el email de invitación, el link debe apuntar a una pantalla nueva tipo `/invitations/:token` que llame a ese endpoint.
- **Notificaciones de preferencias**. La tab Notificaciones hoy solo lista alertas. No hay forma de configurar "quiero email digest sí/no", "frecuencia", etc. Requiere migración nueva (tabla `notification_preferences`) y endpoints.

---

## Cierre del carril CRUDs

Cuando los tres commits estén hechos y todo verde:

```
git push
```

Y avisa al equipo: los 4 agujeros están cerrados, hay borrado de cuenta y la tab Organización ya hace lo que dice ser.

**Una última cosa importante**: tras la tarea 1, comprueba que las cuentas que ya tenían rol distinto a USER siguen funcionando. Esos roles se asignaron a través de la BD o un seed, no del endpoint PATCH. El cambio no los toca, solo bloquea futuros intentos de escalada por API.
