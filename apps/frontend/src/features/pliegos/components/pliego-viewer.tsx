import { useEffect, useState } from 'react';
import { Loader2, FileWarning } from 'lucide-react';
import { pliegosApi } from '../api/pliegos.api';

interface Props {
  pliegoId: string;
}

/**
 * Visor de PDF embebido. Descarga el fichero como Blob (con el Bearer token
 * que añade el interceptor de axios) y lo muestra vía object URL, porque un
 * <iframe src="/pliegos/:id/file"> no puede enviar el header Authorization.
 */
export function PliegoViewer({ pliegoId }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    setUrl(null);
    setError(false);

    pliegosApi
      .fileObjectUrl(pliegoId)
      .then((objectUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        revoked = objectUrl;
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setError(true));

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [pliegoId]);

  if (error) {
    return (
      <div className="flex h-[600px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground">
        <FileWarning className="h-8 w-8" />
        <p>No se pudo cargar el PDF.</p>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <iframe
      src={url}
      title="Visor de pliego"
      className="h-[600px] w-full rounded-lg border"
    />
  );
}
