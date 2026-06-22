// 📍 DESTINO: apps/frontend/src/components/layout/sidebar.tsx  (REEMPLAZAR ENTERO)
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '../language-switcher';
import { useAuthStore } from '@/stores/auth-store';
import { useUser } from '@/features/auth/hooks/use-auth';
import { authApi } from '@/features/auth/api/auth.api';
import { alertsApi } from '@/features/alerts/api/alerts.api';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════
//   Isotipo — 3 barras ascendentes (la 3ª en lima)
// ═══════════════════════════════════════════════════════════

function Isotipo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="2" y="13" width="5" height="9" rx="1.5" className="fill-sidebar-foreground/40" />
      <rect x="9.5" y="8" width="5" height="14" rx="1.5" className="fill-sidebar-foreground/65" />
      <rect x="17" y="3" width="5" height="19" rx="1.5" className="fill-primary" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
//   RailItem — índice mono + label Bricolage, sin iconos
// ═══════════════════════════════════════════════════════════

interface RailItemDef {
  path: string;
  label: string;
  badge?: number;
}

function RailItem({ index, path, label, badge }: RailItemDef & { index: number }) {
  const ix = String(index).padStart(2, '0');

  return (
    <li>
      <NavLink
        to={path}
        end={path === '/app'}
        className={({ isActive }) =>
          cn(
            'group/item relative flex items-center gap-3 py-2',
            isActive
              ? 'text-primary'
              : 'text-sidebar-foreground/65 hover:text-sidebar-foreground',
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* Tick lima que sobresale a la izquierda */}
            {isActive && (
              <span
                className="absolute -left-6 top-1/2 h-[2px] w-[14px] -translate-y-1/2 bg-primary"
                style={{ boxShadow: '0 0 8px var(--sp-lime, currentColor)' }}
              />
            )}
            <span
              className={cn(
                'font-mono text-[0.62rem] tabular-nums',
                isActive ? 'text-primary' : 'text-sidebar-foreground/40',
              )}
            >
              {ix}
            </span>
            <span className="font-display text-[1.18rem] font-semibold tracking-[-0.02em] transition-transform duration-200 group-hover/item:translate-x-1">
              {label}
            </span>
            {badge !== undefined && (
              <span className="ml-auto font-mono text-[0.72rem] tabular-nums text-primary">
                {badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}

// ═══════════════════════════════════════════════════════════
//   RailUser — avatar + nombre + cerrar sesión + idioma/tema
// ═══════════════════════════════════════════════════════════

function RailUser() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const user = useUser();

  const initials = user
    ? `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignoramos errores de logout en server, cerramos sesión igualmente
    } finally {
      useAuthStore.getState().clear();
      toast.success(t('auth:logout.success'));
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="border-t border-sidebar-border px-6 py-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border border-primary/30 bg-primary/10">
          <span className="font-mono text-[0.62rem] font-bold text-primary">
            {initials}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[0.8rem] font-medium text-sidebar-foreground">
            {user ? `${user.firstName} ${user.lastName}` : '—'}
          </div>
          {user && (
            <div className="truncate font-mono text-[0.6rem] text-sidebar-foreground/40">
              {user.email}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleLogout}
          className="font-mono text-[0.62rem] uppercase tracking-[0.08em] text-sidebar-foreground/50 transition-colors hover:text-destructive"
        >
          ↩ {t('navigation.logout')}
        </button>
        <div className="flex items-center gap-1">
          <LanguageSwitcher variant="icon" />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//   Sidebar (Rail)
// ═══════════════════════════════════════════════════════════

export function Sidebar() {
  const { t } = useTranslation('common');

  // Contador dinámico de alertas activas
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list(),
    refetchInterval: 60_000,
  });
  const activeAlertsCount = alerts.filter((a) => a.isActive).length;

  // Navegación del rail: 7 entradas tipográficas (01–07).
  // Calendario incluido (la ruta /calendario ya existe). Analytics queda fuera
  // del rail por ahora; su ruta sigue existiendo. Si lo quieres, dímelo.
  const NAV: RailItemDef[] = [
    { path: '/app', label: t('navigation.dashboard') },
    { path: '/buscar', label: t('navigation.search') },
    {
      path: '/alertas',
      label: t('navigation.alerts'),
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
    },
    { path: '/guardadas', label: t('navigation.saved') },
    { path: '/documentos', label: t('navigation.documents') },
    { path: '/calendario', label: t('navigation.calendar') },
    { path: '/ajustes', label: t('navigation.settings') },
  ];

  return (
    <aside className="flex h-screen w-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:w-[236px]">
      {/* ═══ LOGO ═══ */}
      <Link to="/app" className="flex items-center gap-2.5 px-6 py-6">
        <Isotipo />
        <span className="font-display text-[1.05rem] font-bold tracking-tight text-sidebar-foreground">
          Smart<span className="text-primary">Pliegos</span>
        </span>
      </Link>

      {/* ═══ NAV ═══ */}
      <nav className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mb-5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-sidebar-foreground/40">
          Terminal
        </div>
        <ul className="space-y-1">
          {NAV.map((item, i) => (
            <RailItem key={item.path} index={i + 1} {...item} />
          ))}
        </ul>
      </nav>

      {/* ═══ FOOTER ═══ */}
      <RailUser />
    </aside>
  );
}