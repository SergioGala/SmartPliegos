import { apiPost, apiGet, apiDelete } from '@/lib/api-client';

export interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
}

export interface CreateInvitationPayload {
  email: string;
  organizationId: string;
}

export const invitationsApi = {
  /** POST /invitations — solo ORG_OWNER */
  async create(payload: CreateInvitationPayload): Promise<Invitation> {
    return apiPost<Invitation, CreateInvitationPayload>('/invitations', payload);
  },

  /** GET /invitations/organization/:organizationId */
  async listByOrganization(organizationId: string): Promise<Invitation[]> {
    return apiGet<Invitation[]>(`/invitations/organization/${organizationId}`);
  },

  /** DELETE /invitations/:id — cancela una invitación pendiente */
  async cancel(invitationId: string): Promise<void> {
    await apiDelete<void>(`/invitations/${invitationId}`);
  },
};