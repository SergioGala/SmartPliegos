import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  titulo?: string;
  mensaje?: string;
  onReintentar?: () => void;
}

export function EstadoError({
  titulo = 'No se pudo cargar',
  mensaje = 'Ha ocurrido un error al obtener los datos. Inténtalo de nuevo.',
  onReintentar,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
      <AlertCircle className="size-8 text-destructive" />
      <div>
        <h3 className="mb-1 text-base font-semibold">{titulo}</h3>
        <p className="text-sm text-muted-foreground">{mensaje}</p>
      </div>
      {onReintentar && (
        <Button variant="outline" size="sm" onClick={onReintentar} className="mt-2">
          <RefreshCw className="size-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
}