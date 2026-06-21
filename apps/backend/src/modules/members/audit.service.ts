import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

export interface AuditEntry {
  organizationId: string;
  actorUserId: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  /** Best-effort: la auditoría nunca debe tumbar la operación principal. */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.auditRepo.save(
        this.auditRepo.create({
          ...entry,
          targetType: entry.targetType ?? null,
          targetId: entry.targetId ?? null,
          metadata: entry.metadata ?? {},
        }),
      );
    } catch {
      // Loguear con Winston si quieres, pero no relanzar.
    }
  }

  async list(organizationId: string, limit = 50, offset = 0) {
    if (!organizationId) return [];
    return this.auditRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
      skip: offset,
    });
  }
}
