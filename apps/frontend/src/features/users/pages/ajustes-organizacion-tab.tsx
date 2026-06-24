import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Building2, UserPlus, X, Mail } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { invitationsApi } from '@/features/users/api/invitations.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MemberRow } from '@/features/members/components/member-row';
import { AuditPanel } from '@/features/members/components/audit-panel';
import { useOrgMembers } from '@/features/members/hooks/use-members';

interface InviteFormData {
  email: string;
}

export function AjustesOrganizacionTab() {
  const { t } = useTranslation('settings');
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const isOwner = user?.role === 'ORG_OWNER' || user?.role === 'SUPER_ADMIN';
  const orgId = user?.organizationId;

  const { data: members = [], isLoading: loadingMembers } = useOrgMembers();
  
  const currentUserId = user?.id;
  const myRole = members?.find((m) => m.userId === currentUserId)?.role;
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';
  const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: ['org-invitations', orgId],
    queryFn: () => invitationsApi.listByOrganization(orgId!),
    enabled: !!orgId && isOwner,
  });

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<InviteFormData>({ mode: 'onSubmit' });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormData) =>
      invitationsApi.create({ email: data.email, organizationId: orgId! }),
    onSuccess: () => {
      toast.success(t('organization.invite.success'));
      reset();
      queryClient.invalidateQueries({ queryKey: ['org-invitations', orgId] });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;
        if (backendMessage && typeof backendMessage === 'string') {
          toast.error(backendMessage);
        } else if (error.response?.status === 409) {
          toast.error(t('organization.invite.errors.alreadyExists'));
        } else if (error.response?.status === 403) {
          toast.error(t('organization.invite.errors.forbidden'));
        } else {
          toast.error(t('organization.invite.errors.generic'));
        }
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.cancel(id),
    onSuccess: () => {
      toast.success(t('organization.invitations.cancelled'));
      queryClient.invalidateQueries({ queryKey: ['org-invitations', orgId] });
    },
    onError: () => toast.error(t('common:errors.generic')),
  });

  if (!user) {
    return <div className="text-sm text-muted-foreground">{t('common:status.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('organization.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('organization.subtitle')}</p>
      </div>

      {!orgId && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-md text-sm">
          Aún no formas parte de ninguna organización. Las herramientas de gestión de miembros y facturación no están disponibles.
        </div>
      )}

      {/* Plan info */}
      {orgId && (
        <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Building2 className="size-5 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('organization.planLabel')}</div>
            <div className="text-base font-medium">{user.userPlan ?? '—'}</div>
          </div>
        </div>
      </div>
      )}

      {/* Miembros */}
      {orgId && (
        <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium mb-3">{t('organization.members.title')}</h3>
        {loadingMembers ? (
          <div className="text-sm text-muted-foreground">{t('common:status.loading')}</div>
        ) : members.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t('organization.members.empty')}</div>
        ) : (
          <div>
            {members.map((m) => (
              <MemberRow key={m.id} member={m} canManage={canManage} />
            ))}
          </div>
        )}
      </div>
      )}

      {/* Invitaciones pendientes (solo owner) */}
      {orgId && isOwner && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium mb-3">{t('organization.invitations.title')}</h3>
          {loadingInvitations ? (
            <div className="text-sm text-muted-foreground">{t('common:status.loading')}</div>
          ) : invitations.filter((i) => i.status === 'PENDING').length === 0 ? (
            <div className="text-sm text-muted-foreground">{t('organization.invitations.empty')}</div>
          ) : (
            <ul className="space-y-2">
              {invitations
                .filter((i) => i.status === 'PENDING')
                .map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <Mail className="size-3.5 text-muted-foreground" />
                      <span className="text-sm">{inv.email}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelMutation.mutate(inv.id)}
                      disabled={cancelMutation.isPending}
                      aria-label={t('organization.invitations.cancel')}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {/* Invitar (solo owner) */}
      {orgId && isOwner && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium mb-1">{t('organization.invite.title')}</h3>
          <p className="text-xs text-muted-foreground mb-3">{t('organization.invite.subtitle')}</p>
          <form
            onSubmit={handleSubmit((data) => inviteMutation.mutate(data))}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <Input
              type="email"
              placeholder={t('organization.invite.emailPlaceholder')}
              {...register('email', { required: true })}
              className="flex-1"
            />
            <Button type="submit" disabled={inviteMutation.isPending}>
              <UserPlus className="size-4" />
              {inviteMutation.isPending
                ? t('organization.invite.sending')
                : t('organization.invite.send')}
            </Button>
          </form>
          {errors.email && (
            <p className="text-xs text-destructive mt-2">{t('organization.invite.errors.invalidEmail')}</p>
          )}
        </div>
      )}

      {/* nueva sección Actividad (visible solo si canManage) */}
      {orgId && canManage && (
        <section className="mt-8">
          <h3 className="mb-3 text-sm font-medium">Actividad reciente</h3>
          <div className="bg-card border border-border rounded-lg p-5">
            <AuditPanel />
          </div>
        </section>
      )}
    </div>
  );
}