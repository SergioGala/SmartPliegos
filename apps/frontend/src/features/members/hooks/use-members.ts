import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/members.api';
import type { OrgRole } from '../types';

export function useOrgMembers() {
  return useQuery({ queryKey: ['org-members'], queryFn: () => membersApi.list() });
}

export function useOrgAudit() {
  return useQuery({ queryKey: ['org-audit'], queryFn: () => membersApi.audit() });
}

export function useChangeMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrgRole }) =>
      membersApi.changeRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members'] });
      queryClient.invalidateQueries({ queryKey: ['org-audit'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => membersApi.remove(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members'] });
      queryClient.invalidateQueries({ queryKey: ['org-audit'] });
    },
  });
}
