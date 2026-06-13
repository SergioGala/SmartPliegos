// 📍 DESTINO: apps/frontend/src/features/auth/components/auth-layout.tsx  (REEMPLAZAR ENTERO)
//
// Split «Terminal»: panel de marca a la izquierda (solo desktop) + formulario
// a la derecha. El toggle Iniciar sesión / Crear cuenta se muestra solo en
// /login y /register (reset-password y complete-signup lo ocultan). Mantiene
// las props (title/subtitle/children/footer), así las páginas no cambian su
// contrato. El copy del panel va con defaultValue (i18n-able en F3).
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 30" className={className} fill="none" aria-hidden="true">
      <rect x="2" y="17" width="6" height="11" rx="2" className="fill-foreground" />
      <rect x="12" y="10" width="6" height="18" rx="2" className="fill-foreground" />
      <rect x="22" y="2" width="6" height="26" rx="2" className="fill-primary" />
    </svg>
  );
}

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { t } = useTranslation(['common', 'auth']);
  const { pathname } = useLocation();
  const showTabs = pathname === '/login' || pathname === '/register';
  const isLogin = pathname === '/login';

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* ── Panel de marca (solo desktop) ── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-card p-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, var(--foreground) 0 1px, transparent 1px 26px)',
          }}
        />
        <Link to="/" className="relative inline-flex items-center gap-2.5">
          <LogoMark className="h-7 w-7" />
          <span className="font-display text-lg font-bold tracking-tight">
            Smart<span className="text-primary">Pliegos</span>
          </span>
        </Link>

        <div className="relative">
          <div className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-primary">
            / {t('common:authPanel.eyebrow', { defaultValue: 'acceso' })}
          </div>
          <h2 className="mt-3 max-w-[16ch] font-display text-[clamp(1.8rem,2.6vw,2.6rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-foreground">
            {t('common:authPanel.headline', {
              defaultValue:
                'Encuentra tu próximo contrato entre 288.000 licitaciones públicas.',
            })}
          </h2>
          <p className="mt-4 max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
            {t('common:authPanel.lead', {
              defaultValue:
                'Búsqueda inteligente, alertas en tiempo real y resúmenes con IA. Datos oficiales de PLACE.',
            })}
          </p>
        </div>

        <div className="relative font-mono text-[0.66rem] uppercase tracking-[0.1em] text-muted-foreground/60">
          © {new Date().getFullYear()} {t('common:app.name')} ·{' '}
          {t('common:authPanel.footer', { defaultValue: 'Gratis · sin tarjeta' })}
        </div>
      </aside>

      {/* ── Panel de formulario ── */}
      <main className="flex min-h-screen flex-col px-6 py-10 sm:px-10 lg:px-12">
        <Link to="/" className="inline-flex items-center gap-2.5 lg:hidden">
          <LogoMark className="h-7 w-7" />
          <span className="font-display text-lg font-bold tracking-tight">
            Smart<span className="text-primary">Pliegos</span>
          </span>
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {showTabs && (
            <div className="mb-8 inline-flex w-fit rounded-full border border-border bg-card p-1">
              <Link
                to="/login"
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                  isLogin
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('auth:login.tab', { defaultValue: 'Iniciar sesión' })}
              </Link>
              <Link
                to="/register"
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                  !isLogin
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('auth:register.tab', { defaultValue: 'Crear cuenta' })}
              </Link>
            </div>
          )}

          <h1 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.02em] text-foreground">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        </div>
      </main>
    </div>
  );
}