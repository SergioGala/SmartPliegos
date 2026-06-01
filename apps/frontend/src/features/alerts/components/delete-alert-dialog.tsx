import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { alertsApi } from '../api/alerts.api';
import type { Alert } from '../types';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: Alert;
}

export function DeleteAlertDialog({ open, onOpenChange, alert }: Props) {
  const { t } = useTranslation('alerts');
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => alertsApi.delete(alert.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(t('form.success.deleted'));
      onOpenChange(false);
    },
    onError: () => toast.error(t('form.errors.deleteFailed')),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          'w-full max-w-md bg-card border border-border rounded-lg p-6 shadow-xl'
        )}
      >
        <AlertDialogTitle className="text-lg font-semibold">
          {t('delete.title')}
        </AlertDialogTitle>

        <AlertDialogDescription className="text-sm text-muted-foreground mt-2">
          {t('delete.message', { name: alert.name })}
        </AlertDialogDescription>

        <div className="flex justify-end gap-2 mt-6">
          <AlertDialogCancel className="h-9 px-4 rounded-md border border-input text-sm hover:bg-accent">
            {t('delete.cancel')}
          </AlertDialogCancel>

          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className={cn(
              'h-9 px-4 rounded-md bg-destructive text-destructive-foreground',
              'text-sm font-medium hover:bg-destructive/90',
              'disabled:opacity-50'
            )}
          >
            {deleteMutation.isPending
              ? t('common:status.deleting')
              : t('delete.confirm')}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}