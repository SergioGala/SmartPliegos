import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';
import { useUploadDocument } from '../hooks/use-documents';
import { cn } from '@/lib/utils';

const ALLOWED = [
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png', 'image/jpeg', 'text/plain',
];
const MAX_BYTES = 5 * 1024 * 1024;

export function UploadDropzone() {
  const { t } = useTranslation('documents');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const upload = useUploadDocument();

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (!ALLOWED.includes(file.type)) { toast.error(t('errors.mime')); return; }
    if (file.size > MAX_BYTES) { toast.error(t('errors.size')); return; }
    try {
      await upload.mutateAsync({ file, onProgress: setProgress });
      toast.success(t('upload.success', { name: file.name }));
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); void handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click(); }}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
        dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
      )}
    >
      <UploadCloud className="text-muted-foreground" size={28} />
      <p className="text-sm font-medium">{t('upload.cta')}</p>
      <p className="text-xs text-muted-foreground">{t('upload.hint')}</p>
      {progress !== null && (
        <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden mt-2">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => void handleFiles(e.target.files)} />
    </div>
  );
}