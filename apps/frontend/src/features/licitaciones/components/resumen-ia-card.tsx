import { useState } from 'react';
import { isAxiosError } from 'axios';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { licitacionesApi } from '../api/licitaciones.api';

interface Props {
  licitacionId: string;
  resumenInicial: string | null;
}

export function ResumenIaCard({ licitacionId, resumenInicial }: Props) {
  const [resumen, setResumen] = useState<string | null>(resumenInicial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generar = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await licitacionesApi.generarResumen(licitacionId);
      setResumen(data.resumenIA);
    } catch (err) {
      // 503 = IA no configurada/caída. 429 = rate limit. Resto = genérico.
      if (isAxiosError(err)) {
        if (err.response?.status === 503) {
          setError('El servicio de IA no está disponible ahora mismo.');
        } else if (err.response?.status === 429) {
          setError('Demasiadas peticiones. Inténtalo en un minuto.');
        } else {
          setError('No se pudo generar el resumen. Inténtalo de nuevo.');
        }
      } else {
        setError('No se pudo generar el resumen. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <Sparkles className="size-4 text-primary" aria-hidden />
        <CardTitle className="text-sm">Resumen IA</CardTitle>
      </CardHeader>
      <CardContent>
        {resumen ? (
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {resumen}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Genera un resumen automático de esta licitación con IA.
            </p>
            <Button size="sm" onClick={generar} disabled={loading}>
              {loading ? 'Generando…' : 'Generar resumen'}
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}