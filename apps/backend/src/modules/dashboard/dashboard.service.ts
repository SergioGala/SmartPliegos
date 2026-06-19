import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FavoritoEntity } from '../favoritos/entities';
import { AlertEntity } from '../alerts/entities';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';

import type {
    DashboardSummary,
    Distribucion,
    DistribucionBucket,
    VencimientoItem,
} from './interfaces/dashboard.interfaces';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(FavoritoEntity)
        private readonly favRepo: Repository<FavoritoEntity>,

        @InjectRepository(Licitacion)
        private readonly licitacionRepo: Repository<Licitacion>,

        @InjectRepository(AlertEntity)
        private readonly alertRepo: Repository<AlertEntity>,
    ) { }

    async summary(userId: string): Promise<DashboardSummary> {
        const favoritos = await this.favRepo.count({
            where: { userId },
        });

        const venciendoEn7Dias = await this.favRepo
            .createQueryBuilder('f')
            .innerJoin('licitaciones', 'l', 'l.id = f."licitacionId"')
            .where('f."userId" = :userId', { userId })
            .andWhere('l."fechaPresentacion" BETWEEN now() AND now() + interval \'7 days\'')
            .getCount();

        const nuevasEstaSemana = await this.licitacionRepo
            .createQueryBuilder('l')
            .where('l."fechaPublicacion" >= date_trunc(\'week\', now())')
            .getCount();

        return {
            favoritos,
            venciendoEn7Dias,
            recordatoriosPendientes: 0,
            nuevasEstaSemana,
        };
    }

    async vencimientos(userId: string, days: number): Promise<VencimientoItem[]> {
        const rows = await this.favRepo
            .createQueryBuilder('f')
            .innerJoin('licitaciones', 'l', 'l.id = f."licitacionId"')
            .leftJoin('organos_contratacion', 'o', 'o.id = l."organoId"')
            .where('f."userId" = :userId', { userId })
            .andWhere('l."fechaPresentacion" IS NOT NULL')
            .andWhere(
                'l."fechaPresentacion" BETWEEN now() AND now() + make_interval(days => :days)',
                { days },
            )
            .orderBy('l."fechaPresentacion"', 'ASC')
            .select([
                'l."id" AS "licitacionId"',
                'l."title" AS "title"',
                'o."nombre" AS "organo"',
                'l."fechaPresentacion" AS "fechaPresentacion"',
                'l."presupuestoBase" AS "presupuestoBase"',
                `CEIL(EXTRACT(EPOCH FROM (l."fechaPresentacion" - now())) / 86400) AS "diasRestantes"`,
            ])
            .getRawMany();

        return rows.map((row) => ({
            licitacionId: row.licitacionId,
            title: row.title,
            organo: row.organo ?? null,
            fechaPresentacion:
                row.fechaPresentacion instanceof Date
                    ? row.fechaPresentacion.toISOString()
                    : new Date(row.fechaPresentacion).toISOString(),
            presupuestoBase:
                row.presupuestoBase === null || row.presupuestoBase === undefined
                    ? null
                    : String(row.presupuestoBase),
            diasRestantes: Number(row.diasRestantes),
        }));
    }

    async distribucion(userId: string): Promise<Distribucion> {
        const porTipoContratoRows = await this.favRepo
            .createQueryBuilder('f')
            .innerJoin('licitaciones', 'l', 'l.id = f."licitacionId"')
            .where('f."userId" = :userId', { userId })
            .select(`COALESCE(l."tipoContrato", 'Sin tipo')`, 'key')
            .addSelect('COUNT(*)', 'count')
            .groupBy(`COALESCE(l."tipoContrato", 'Sin tipo')`)
            .orderBy('COUNT(*)', 'DESC')
            .limit(8)
            .getRawMany();

        const porCcaaRows = await this.favRepo
            .createQueryBuilder('f')
            .innerJoin('licitaciones', 'l', 'l.id = f."licitacionId"')
            .where('f."userId" = :userId', { userId })
            .select(`COALESCE(l."ccaa", 'Sin CCAA')`, 'key')
            .addSelect('COUNT(*)', 'count')
            .groupBy(`COALESCE(l."ccaa", 'Sin CCAA')`)
            .orderBy('COUNT(*)', 'DESC')
            .limit(8)
            .getRawMany();

        const toBuckets = (
            rows: Array<{ key: string | null; count: string | number }>,
        ): DistribucionBucket[] =>
            rows.map((row) => ({
                key: row.key ?? 'Sin dato',
                count: Number(row.count),
            }));

        return {
            porTipoContrato: toBuckets(porTipoContratoRows),
            porCcaa: toBuckets(porCcaaRows),
        };
    }

    async series(userId: string) {
        return [];
    }
}