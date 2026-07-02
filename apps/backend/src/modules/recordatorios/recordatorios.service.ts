import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { RecordatorioEntity } from './recordatorio.entity';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { FavoritosService } from '../favoritos/favoritos.service';
import { EmailService } from '../../infrastructure/email/email.service';
import { recordatorioTemplate } from './recordatorio.template';
import type { UpsertRecordatorioDto } from './dto/upsert-recordatorio.dto';

export interface CalendarioEvento {
  licitacionId: string;
  title: string;
  fechaPresentacion: string; // ISO
  recordatorio: { id: string; daysBefore: number; status: string } | null;
}

@Injectable()
export class RecordatoriosService {
  private readonly logger = new Logger(RecordatoriosService.name);

  constructor(
    @InjectRepository(RecordatorioEntity) private readonly repo: Repository<RecordatorioEntity>,
    @InjectRepository(Licitacion) private readonly licRepo: Repository<Licitacion>,
    private readonly favoritosService: FavoritosService,
    private readonly emailService: EmailService,
  ) {}

  /** remindAt = plazo de presentación − daysBefore días. */
  private computeRemindAt(deadline: Date, daysBefore: number): Date {
    const d = new Date(deadline);
    d.setDate(d.getDate() - daysBefore);
    return d;
  }

  /** Crea o actualiza el recordatorio de una licitación para el usuario. */
  async upsert(userId: string, dto: UpsertRecordatorioDto): Promise<RecordatorioEntity> {
    const lic = await this.licRepo.findOne({ where: { id: dto.licitacionId } });
    if (!lic) throw new NotFoundException('Licitación no encontrada');
    if (!lic.fechaPresentacion) {
      throw new BadRequestException('La licitación no tiene fecha de presentación');
    }

    const remindAt = this.computeRemindAt(lic.fechaPresentacion, dto.daysBefore);
    let rec = await this.repo.findOne({ where: { userId, licitacionId: dto.licitacionId } });

    if (rec) {
      rec.daysBefore = dto.daysBefore;
      rec.note = dto.note ?? null;
      rec.remindAt = remindAt;
      rec.status = 'PENDING';
      rec.sentAt = null;
    } else {
      rec = this.repo.create({
        userId,
        licitacionId: dto.licitacionId,
        daysBefore: dto.daysBefore,
        note: dto.note ?? null,
        remindAt,
        status: 'PENDING',
      });
    }
    return this.repo.save(rec);
  }

  findAllByUser(userId: string): Promise<RecordatorioEntity[]> {
    return this.repo.find({ where: { userId }, relations: ['licitacion'], order: { remindAt: 'ASC' } });
  }

  async removeByLicitacion(userId: string, licitacionId: string): Promise<void> {
    const result = await this.repo.delete({ userId, licitacionId });
    if (!result.affected) throw new NotFoundException('Recordatorio no encontrado');
  }

  /** Eventos del calendario: plazos de los favoritos + si tienen recordatorio. */
  async getCalendario(userId: string): Promise<CalendarioEvento[]> {
    const [favoritos, recordatorios] = await Promise.all([
      this.favoritosService.findAllByUser(userId),
      this.findAllByUser(userId),
    ]);
    const recByLic = new Map(recordatorios.map((r) => [r.licitacionId, r]));

    return favoritos
      .filter((f) => f.licitacion?.fechaPresentacion)
      .map((f) => {
        const rec = recByLic.get(f.licitacionId);
        return {
          licitacionId: f.licitacionId,
          title: f.licitacion.title,
          fechaPresentacion: new Date(f.licitacion.fechaPresentacion as Date).toISOString(),
          recordatorio: rec ? { id: rec.id, daysBefore: rec.daysBefore, status: rec.status } : null,
        };
      });
  }

  /** Envía los recordatorios vencidos. Llamado por el scheduler. */
  async sendDue(now = new Date()): Promise<number> {
    const due = await this.repo.find({
      where: { status: 'PENDING', remindAt: LessThanOrEqual(now) },
      relations: ['user', 'licitacion'],
    });

    let sent = 0;
    await Promise.all(
      due.map(async (rec) => {
        try {
          const to = rec.user?.email;
          if (!to) {
            this.logger.warn(`Recordatorio ${rec.id} sin email destino, skip`);
            return;
          }
          await this.emailService.sendEmail({
            to,
            subject: `⏰ Tu plazo vence en ${rec.daysBefore} día(s): ${rec.licitacion.title}`,
            html: recordatorioTemplate(rec.licitacion, rec.daysBefore),
          });
          rec.status = 'SENT';
          rec.sentAt = new Date();
          await this.repo.save(rec);
          sent++;
        } catch (e) {
          this.logger.error(`Error enviando recordatorio ${rec.id}: ${e instanceof Error ? e.message : 'unknown'}`);
        }
      })
    );
    if (sent) this.logger.log(`Enviados ${sent} recordatorios`);
    return sent;
  }
}