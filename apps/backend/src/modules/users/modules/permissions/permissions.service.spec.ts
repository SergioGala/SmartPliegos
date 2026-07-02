import { PermissionsService } from './permissions.service';
import { Role, Plan } from '../../enums';
import type { UserEntity, OrganizationEntity } from '../../entities';

const limitsService = {
  getUserTokensPerMonth: jest.fn(() => 1000),
  getMaxSavedSearches: jest.fn(() => 20),
};

const service = new PermissionsService(limitsService as never);

const user = (over: Partial<UserEntity> = {}): UserEntity =>
  ({ role: Role.PUBLIC_USER, userPlan: Plan.FREE, isActive: true, organizationId: undefined, ...over } as UserEntity);
const org = (plan: Plan): OrganizationEntity => ({ id: 'org-1', plan } as OrganizationEntity);

describe('PermissionsService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getRolePermissions', () => {
    it('SUPER_ADMIN tiene todos los permisos', () => {
      expect(service.getRolePermissions(Role.SUPER_ADMIN)).toEqual({
        canManageUsers: true, canManageLicitaciones: true, canViewAnalytics: true, canManagePlan: true,
      });
    });
    it('ORG_MEMBER no gestiona usuarios ni plan', () => {
      const p = service.getRolePermissions(Role.ORG_MEMBER);
      expect(p.canManageUsers).toBe(false);
      expect(p.canManagePlan).toBe(false);
      expect(p.canViewAnalytics).toBe(true);
    });
    it('PUBLIC_USER no ve analytics', () => {
      expect(service.getRolePermissions(Role.PUBLIC_USER).canViewAnalytics).toBe(false);
    });
  });

  describe('getPlanPermissions', () => {
    it('plan individual FREE', () => {
      expect(service.getPlanPermissions(Plan.FREE).canAccessHistorical).toBe(false);
    });
    it('plan de organización PROFESSIONAL habilita integraciones', () => {
      expect(service.getPlanPermissions(Plan.PROFESSIONAL).canUseIntegrations).toBe(true);
    });
    it('lanza error con plan de organización no reconocido', () => {
      expect(() => service.getPlanPermissions('INVENTADO' as Plan)).toThrow();
    });
  });

  describe('getUserPlanPermissions', () => {
    it('mapea PRO a la forma UserPlanPermission', () => {
      const p = service.getUserPlanPermissions(Plan.PRO);
      expect(p.canAccessHistorical).toBe(true);
      expect(p.hasAdvancedSearch).toBe(false);
    });
  });

  describe('getCombinedPermissions', () => {
    it('con organización usa el plan de la org y marca pertenencia', () => {
      const p = service.getCombinedPermissions(
        user({ role: Role.ORG_OWNER, organizationId: 'org-1' }),
        org(Plan.PROFESSIONAL),
      );
      expect(p.canManageUsers).toBe(true);
      expect(p.canUseIntegrations).toBe(true);
      expect(p.belongsToOrganization).toBe(true);
    });
    it('PUBLIC_USER sin org usa su plan individual', () => {
      const p = service.getCombinedPermissions(user({ role: Role.PUBLIC_USER, userPlan: Plan.PRO }));
      expect(p.canAccessHistorical).toBe(true);
      expect(p.belongsToOrganization).toBe(false);
    });
    it('sin org ni userPlan solo hereda permisos de rol', () => {
  const p = service.getCombinedPermissions(user({ role: Role.PUBLIC_USER, userPlan: undefined }));
  expect(p.canCreateAlerts).toBeFalsy();   // ← antes: .toBe(false)
  expect(p.isActive).toBe(true);
});
  });

  describe('checks de rol', () => {
    it('canManageUsers solo OWNER/SUPER_ADMIN', () => {
      expect(service.canManageUsers(user({ role: Role.ORG_OWNER }))).toBe(true);
      expect(service.canManageUsers(user({ role: Role.ORG_MEMBER }))).toBe(false);
    });
    it('canManageLicitaciones incluye a PUBLIC_USER', () => {
      expect(service.canManageLicitaciones(user({ role: Role.PUBLIC_USER }))).toBe(true);
    });
    it('canViewAnalytics excluye a PUBLIC_USER', () => {
      expect(service.canViewAnalytics(user({ role: Role.PUBLIC_USER }))).toBe(false);
      expect(service.canViewAnalytics(user({ role: Role.ORG_MEMBER }))).toBe(true);
    });
    it('canManagePlan solo OWNER/SUPER_ADMIN', () => {
      expect(service.canManagePlan(user({ role: Role.ORG_MEMBER }))).toBe(false);
    });
    it('isSuperAdmin / isOrgOwner / isReadOnly', () => {
      expect(service.isSuperAdmin(user({ role: Role.SUPER_ADMIN }))).toBe(true);
      expect(service.isOrgOwner(user({ role: Role.ORG_OWNER }))).toBe(true);
      expect(service.isReadOnly(user({ role: Role.PUBLIC_USER }))).toBe(true);
    });
    it('isPublicUser exige NO tener organización', () => {
  expect(service.isPublicUser(user({ role: Role.PUBLIC_USER, organizationId: undefined }))).toBe(true);
  expect(service.isPublicUser(user({ role: Role.PUBLIC_USER, organizationId: 'x' }))).toBe(false);
});
  });

  describe('checks de plan de organización', () => {
    it('canCreatePipeline siempre false', () => {
      expect(service.canCreatePipeline()).toBe(false);
    });
    it('canCreateAlert según plan', () => {
      expect(service.canCreateAlert(org(Plan.STARTER))).toBe(true);
      expect(service.canCreateAlert(org(Plan.FREE))).toBe(false);
    });
    it('canUseIntegrations solo PROFESSIONAL', () => {
      expect(service.canUseIntegrations(org(Plan.PROFESSIONAL))).toBe(true);
      expect(service.canUseIntegrations(org(Plan.STARTER))).toBe(false);
    });
    it('canUseWorkflows siempre false', () => {
      expect(service.canUseWorkflows()).toBe(false);
    });
    it('canAccessHistorical para planes de org', () => {
      expect(service.canAccessHistorical(org(Plan.STARTER))).toBe(true);
    });
  });

  describe('checks de plan individual', () => {
    it('userCanCreateAlerts solo PUBLIC_USER con plan', () => {
      expect(service.userCanCreateAlerts(user({ role: Role.PUBLIC_USER, userPlan: Plan.FREE }))).toBe(true);
      expect(service.userCanCreateAlerts(user({ role: Role.ORG_OWNER }))).toBe(false);
      expect(service.userCanCreateAlerts(user({ role: Role.PUBLIC_USER, userPlan: undefined }))).toBe(false);
    });
    it('userCanAccessHistorical: PRO sí, FREE no', () => {
      expect(service.userCanAccessHistorical(user({ userPlan: Plan.PRO }))).toBe(true);
      expect(service.userCanAccessHistorical(user({ userPlan: Plan.FREE }))).toBe(false);
    });
  });

  describe('límites', () => {
    it('getAICreditsLimit', () => {
      expect(service.getAICreditsLimit(Plan.FREE)).toBe(50);
      expect(service.getAICreditsLimit('X' as Plan)).toBe(0);
    });
    it('getAlertsLimit', () => {
      expect(service.getAlertsLimit(Plan.PRO)).toBe(5);
      expect(service.getAlertsLimit('X' as Plan)).toBe(0);
    });
    it('getUserTokensPerMonth delega en LimitsService para PUBLIC_USER', () => {
      expect(service.getUserTokensPerMonth(user({ role: Role.PUBLIC_USER, userPlan: Plan.PRO }))).toBe(1000);
      expect(limitsService.getUserTokensPerMonth).toHaveBeenCalled();
    });
    it('getUserTokensPerMonth devuelve 0 si no es PUBLIC_USER', () => {
      expect(service.getUserTokensPerMonth(user({ role: Role.ORG_OWNER }))).toBe(0);
    });
    it('getMaxSavedSearches delega o 0', () => {
      expect(service.getMaxSavedSearches(user({ role: Role.PUBLIC_USER, userPlan: Plan.PRO }))).toBe(20);
      expect(service.getMaxSavedSearches(user({ role: Role.ORG_MEMBER }))).toBe(0);
    });
    it('límites de organización', () => {
      expect(service.getOrganizationUsersLimit(Plan.STARTER)).toBe(3);
      expect(service.getOrganizationUsersLimit('X' as Plan)).toBe(0);
      expect(service.getOrganizationAlertsLimit(Plan.PROFESSIONAL)).toBe(15);
      expect(service.getOrganizationAICreditsLimit(Plan.PROFESSIONAL)).toBe(5000);
    });
  });

  describe('validaciones', () => {
    it('validateUserBelongsToOrganization: SUPER_ADMIN siempre pasa', () => {
      expect(service.validateUserBelongsToOrganization(user({ role: Role.SUPER_ADMIN }), 'org-1').allowed).toBe(true);
    });
    it('validateUserBelongsToOrganization: pertenece / no pertenece', () => {
      expect(service.validateUserBelongsToOrganization(user({ organizationId: 'org-1' }), 'org-1').allowed).toBe(true);
      const no = service.validateUserBelongsToOrganization(user({ organizationId: 'org-2' }), 'org-1');
      expect(no.allowed).toBe(false);
      expect(no.reason).toContain('no pertenece');
    });
    it('validateUserIsActive', () => {
      expect(service.validateUserIsActive(user({ isActive: true })).allowed).toBe(true);
      expect(service.validateUserIsActive(user({ isActive: false })).allowed).toBe(false);
    });
    it('validatePermissions: bloquea si inactivo', () => {
      const r = service.validatePermissions(user({ isActive: false }), org(Plan.PROFESSIONAL), ['canManageUsers']);
      expect(r.allowed).toBe(false);
    });
    it('validatePermissions: bloquea si falta un permiso', () => {
      const r = service.validatePermissions(
        user({ role: Role.ORG_MEMBER, isActive: true, organizationId: 'org-1' }),
        org(Plan.PROFESSIONAL),
        ['canManageUsers'],
      );
      expect(r.allowed).toBe(false);
      expect(r.reason).toContain('canManageUsers');
    });
    it('validatePermissions: permite si tiene todos', () => {
      const r = service.validatePermissions(
        user({ role: Role.ORG_OWNER, isActive: true, organizationId: 'org-1' }),
        org(Plan.PROFESSIONAL),
        ['canManageUsers', 'canUseIntegrations'],
      );
      expect(r.allowed).toBe(true);
    });
  });
});