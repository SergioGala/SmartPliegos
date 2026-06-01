import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './sidebar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { OnboardingWizard } from '@/features/alerts/components/onboarding-wizard';
import { useShouldShowOnboarding } from '@/features/alerts/hooks/use-should-show-onboarding';

export function AppLayout() {
  const { shouldShow } = useShouldShowOnboarding();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Cerramos el drawer cuando cambia la ruta. Comparar la pathname actual
  // con la última vista durante el render hace el "reset" sin useEffect.
  // Patrón oficial de React: "Adjusting state during a render".
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar fijo de escritorio: solo desde 768px (md) en adelante */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-auto min-w-0">
        {/* Header móvil con botón hamburguesa: solo en <768px */}
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-border sticky top-0 bg-background z-20">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menú">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        <Outlet />
      </main>
      {shouldShow && <OnboardingWizard />}
    </div>
  );
}