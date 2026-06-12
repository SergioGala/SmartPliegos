// 📍 DESTINO: apps/frontend/src/features/users/pages/ajustes-page.tsx  (REEMPLAZAR ENTERO)
//
// Solo cambia el CASCARÓN (cabecera + nav de tabs). Los 5 tabs son rutas
// aparte y heredan el tema (charcoal+lima) por sus tokens — no se tocan.
import { Helmet } from 'react-helmet-async';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function AjustesPage() {
  const { t } = useTranslation('settings');

  const TABS = [
    { path: 'perfil', labelKey: 'tabs.profile' },
    { path: 'seguridad', labelKey: 'tabs.security' },
    { path: 'notificaciones', labelKey: 'tabs.notifications' },
    { path: 'organizacion', labelKey: 'tabs.organization' },
    { path: 'preferencias', labelKey: 'tabs.preferences' },
  ] as const;

  return (
    <>
      <Helmet>
        <title>{t('page.title')} · SmartPliegos</title>
      </Helmet>

      <div className="mx-auto max-w-[1100px] px-6 pb-24 pt-10 md:px-12">
        <header>
          <div className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-primary">
            / {t('page.title')}
          </div>
          <h1 className="mt-2 font-display text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.025em] text-foreground">
            {t('page.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('page.subtitle')}</p>
        </header>

        <div className="mt-10 flex flex-col gap-10 lg:flex-row">
          {/* Nav de tabs (tipográfica) */}
          <nav className="shrink-0 lg:w-52">
            <ul className="flex gap-x-4 gap-y-1 overflow-x-auto border-b border-border pb-2 lg:flex-col lg:gap-0 lg:border-b-0 lg:pb-0">
              {TABS.map((tab) => (
                <li key={tab.path}>
                  <NavLink to={tab.path} className="group relative block whitespace-nowrap py-2 lg:pl-4">
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 hidden h-4 w-[2px] -translate-y-1/2 bg-primary lg:block" />
                        )}
                        <span
                          className={cn(
                            'text-sm transition-colors',
                            isActive
                              ? 'font-medium text-primary'
                              : 'text-muted-foreground group-hover:text-foreground',
                          )}
                        >
                          {t(tab.labelKey)}
                        </span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contenido del tab activo */}
          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}

/** Redirect por defecto: /ajustes → /ajustes/perfil */
export function AjustesIndexRedirect() {
  return <Navigate to="perfil" replace />;
}