import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MembersService } from './members.service';
import { AuditService } from './audit.service';
import { OrganizationMember, OrgRole } from './entities/organization-member.entity';

const ORG_ID = 'org-1';

function makeMember(overrides: Partial<OrganizationMember> = {}): OrganizationMember {
  return {
    id: 'm-1',
    organizationId: ORG_ID,
    userId: 'u-1',
    role: OrgRole.MEMBER,
    user: { firstName: 'Ana', lastName: 'García', email: 'ana@acme.es' },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as OrganizationMember;
}

describe('MembersService', () => {
  let service: MembersService;
  const repo = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    save: jest.fn((x) => Promise.resolve(x)),
    remove: jest.fn(),
    create: jest.fn((x) => x),
  };
  const audit = { log: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: getRepositoryToken(OrganizationMember), useValue: repo },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(MembersService);
  });

  describe('changeRole', () => {
    const owner = makeMember({ userId: 'owner-1', role: OrgRole.OWNER });

    it('lanza NotFound si el target no está en la org', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.changeRole(owner, 'u-x', { role: OrgRole.ADMIN }),
      ).rejects.toThrow(NotFoundException);
    });

    it('impide degradar al último OWNER', async () => {
      repo.findOne.mockResolvedValue(makeMember({ userId: 'owner-1', role: OrgRole.OWNER }));
      repo.count.mockResolvedValue(1);
      await expect(
        service.changeRole(owner, 'owner-1', { role: OrgRole.MEMBER }),
      ).rejects.toThrow(BadRequestException);
    });

    it('un ADMIN no puede nombrar OWNERs', async () => {
      const admin = makeMember({ userId: 'admin-1', role: OrgRole.ADMIN });
      repo.findOne.mockResolvedValue(makeMember({ userId: 'u-2' }));
      await expect(
        service.changeRole(admin, 'u-2', { role: OrgRole.OWNER }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('cambia el rol y registra auditoría', async () => {
      repo.findOne.mockResolvedValue(makeMember({ userId: 'u-2', role: OrgRole.MEMBER }));
      repo.count.mockResolvedValue(2);
      await service.changeRole(owner, 'u-2', { role: OrgRole.ADMIN });

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ role: OrgRole.ADMIN }));
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MEMBER_ROLE_CHANGED' }),
      );
    });
  });

  describe('removeMember', () => {
    const owner = makeMember({ userId: 'owner-1', role: OrgRole.OWNER });

    it('impide auto-expulsión', async () => {
      await expect(service.removeMember(owner, 'owner-1')).rejects.toThrow(BadRequestException);
    });

    it('un ADMIN no puede expulsar a un OWNER', async () => {
      const admin = makeMember({ userId: 'admin-1', role: OrgRole.ADMIN });
      repo.findOne.mockResolvedValue(makeMember({ userId: 'owner-1', role: OrgRole.OWNER }));
      await expect(service.removeMember(admin, 'owner-1')).rejects.toThrow(ForbiddenException);
    });

    it('expulsa y registra auditoría', async () => {
      repo.findOne.mockResolvedValue(makeMember({ userId: 'u-2' }));
      await service.removeMember(owner, 'u-2');

      expect(repo.remove).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MEMBER_REMOVED' }),
      );
    });
  });

  describe('addMember', () => {
    it('es idempotente si el membership ya existe', async () => {
      repo.findOne.mockResolvedValue(makeMember());
      await service.addMember(ORG_ID, 'u-1');
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
