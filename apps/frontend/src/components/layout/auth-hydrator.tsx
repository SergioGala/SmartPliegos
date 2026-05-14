import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../../stores/auth-store';

export function AuthHydrator({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <>{children}</>;
}