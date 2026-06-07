import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Bell,
  Bookmark,
  BarChart3,
  Calendar,
  Settings,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  FolderArchive
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
//   Types
// ═══════════════════════════════════════════════════════════

interface NavItemDef {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

// ═══════════════════════════════════════════════════════════
//   NavItem
// ═══════════════════════════════════════════════════════════

function NavItem({ path, label, icon: Icon, badge }: NavItemDef) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-[22%] h-[56%] w-[2px] rounded-r-full bg-sidebar-primary shadow-glow"
            />
          )}
          <Icon size={16} strokeWidth={1.75} className="shrink-0" />
          <span className="flex-1 truncate">{label}</span>
          {badge !== undefined && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ═══════════════════════════════════════════════════════════
//   NavSection
// ═══════════════════════════════════════════════════════════

function NavSection({ title, items }: { title: string; items: NavItemDef[] }) {
  return (
    <div>
      <h3 className="px-3 pb-2 text-[10px] font-semibold tracking-[0.15em] text-sidebar-foreground/40 uppercase">
        {title}
      </h3>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//   SidebarUserMenu
// ═══════════════════════════════════════════════════════════

function SidebarUserMenu() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const user = useUser();

  if (!user) {
    // Estado de carga — no debería ocurrir dentro de ProtectedRoute
    return (
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5 opacity-50">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/15 border border-sidebar-primary/25" />
          <div className="flex-1 min-w-0">
            <div className="h-3 w-20 bg-sidebar-accent/30 rounded" />
          </div>
        </div>
        <div className="mt-2 flex justify-end gap-1">
          <LanguageSwitcher variant="icon" />
          <ThemeToggle />
        </div>
      </div>
    );
  }

  const initials =
    `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase() || 'U';

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
    <div className="border-t border-sidebar-border p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg',
              'hover:bg-sidebar-accent/30 transition-colors text-left'
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary/15 border border-sidebar-primary/25 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-sidebar-accent-foreground">
                {initials}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">
                {user.firstName} {user.lastName}
              </div>

              <div className="text-[10px] text-sidebar-foreground/40 truncate">
                {user.email}
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          sideOffset={8}
          align="end"
          className={cn(
            'min-w-[200px] rounded-md border border-border bg-popover',
            'text-popover-foreground shadow-md p-1 text-sm'
          )}
        >
          <DropdownMenuItem
            onClick={() => navigate('/ajustes/perfil')}
            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground"
          >
            <UserIcon size={14} />
            {t('navigation.profile')}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate('/ajustes')}
            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground"
          >
            <SettingsIcon size={14} />
            {t('navigation.settings')}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 h-px bg-border" />

          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-destructive"
          >
            <LogOut size={14} />
            {t('navigation.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Controles de idioma y tema */}
      <div className="mt-2 flex justify-end gap-1">
        <LanguageSwitcher variant="icon" />
        <ThemeToggle />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//   Sidebar (componente principal)
// ═══════════════════════════════════════════════════════════

export function Sidebar() {
  const { t } = useTranslation('common');

  // Contador dinámico de alertas activas (del Sprint A3)
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list(),
    refetchInterval: 60_000,
  });
  const activeAlertsCount = alerts.filter((a) => a.isActive).length;

  const NAV_PRINCIPAL: NavItemDef[] = [
    { path: '/app', label: t('navigation.dashboard'), icon: LayoutDashboard },
    { path: '/buscar', label: t('navigation.search'), icon: Search },
    {
      path: '/alertas',
      label: t('navigation.alerts'),
      icon: Bell,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
    },
    { path: '/guardadas', label: t('navigation.saved'), icon: Bookmark },
    { path: '/documentos', label: t('navigation.documents'), icon: FolderArchive },
  ];

  const NAV_HERRAMIENTAS: NavItemDef[] = [
    { path: '/analytics', label: t('navigation.analytics'), icon: BarChart3 },
    { path: '/calendario', label: t('navigation.calendar'), icon: Calendar },
    { path: '/ajustes', label: t('navigation.settings'), icon: Settings },
  ];

  return (
    <aside className="flex flex-col w-60 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      {/* ═══ LOGO (link al home orbital) ═══ */}
      <Link
        to="/app"
        className="group flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border hover:bg-sidebar-accent/30 transition-colors"
      >
        <div
           className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center transition-shadow shadow-glow"
        >
          <span className="font-black text-base text-sidebar-primary-foreground leading-none">
            L
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold tracking-tight truncate">
            {t('app.name')}
          </div>
          <div className="text-[9px] font-bold tracking-[0.18em] text-sidebar-accent-foreground/70">
            PRO · BETA
          </div>
        </div>
      </Link>

      {/* ═══ NAV ═══ */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <NavSection
          title={t('navigation.sections.main')}
          items={NAV_PRINCIPAL}
        />
        <NavSection
          title={t('navigation.sections.tools')}
          items={NAV_HERRAMIENTAS}
        />
      </nav>

      {/* ═══ FOOTER (user + language + theme) ═══ */}
      <SidebarUserMenu />
    </aside>
  );
}