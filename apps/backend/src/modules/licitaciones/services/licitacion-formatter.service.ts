import { Injectable } from '@nestjs/common';
import { Licitacion } from '../../scraping/shared/entities/licitacion.entity';
import { ILicitacionFormatter } from '../interfaces/licitacion-formatter.interface';


export interface LicitacionListItemDto {
  id: string;
  title: string;
  estado: unknown;
  tipoContrato: unknown;
  procedimiento: unknown;
  presupuestoBase: number | null;
  presupuestoConIva: number | null;
  cpvCodes: unknown;
  ccaa: unknown;
  provincia: unknown;
  fechaPublicacion: unknown;
  fechaPresentacion: unknown;
  organo: { id: string; nombre: string } | null;
  tieneLotes: unknown;
}

export type LicitacionDetailDto = Record<string, unknown>;

/**
 * Tipo mínimo que esperamos de un valor "decimal-like" devuelto por TypeORM.
 * Tiene método toNumber() (típico en librerías como decimal.js).
 */
interface DecimalLike {
  toNumber: () => number;
}

function isDecimalLike(value: unknown): value is DecimalLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value).toNumber === 'function'
  );
}

/**
 * Servicio encargado de formatear licitaciones para distintos contextos.
 * Incluye lógica de seguridad (enmascaramiento de PII).
 */
@Injectable()
export class LicitacionFormatterService implements ILicitacionFormatter {
  /**
   * Formatea licitación para listado (campos limitados, performance optimizado).
   */
 formatList(l: Licitacion): LicitacionListItemDto {
    return {
      id: l.id,
      title: l.title,
      estado: l.estado,
      tipoContrato: l.tipoContrato,
      procedimiento: l.procedimiento,
      presupuestoBase: this.safeDecimalToNumber(l.presupuestoBase),
      presupuestoConIva: this.safeDecimalToNumber(l.presupuestoConIva),
      cpvCodes: l.cpvCodes,
      ccaa: l.ccaa,
      provincia: l.provincia,
      fechaPublicacion: l.fechaPublicacion,
      fechaPresentacion: l.fechaPresentacion,
      organo: l.organo
        ? {
            id: l.organo.id,
            nombre: l.organo.nombre,
          }
        : null,
      tieneLotes: l.tieneLotes,
    };
  }

  /**
   * Formatea licitación para detalle (todos los campos).
   * IMPORTANTE: Incluye datos sensibles enmascarados.
   */
  formatDetail(l: Licitacion): LicitacionDetailDto {
   const detail: LicitacionDetailDto = {
      id: l.id,
      externalId: l.externalId,
      source: l.source,
      title: l.title,
      description: l.description,
      estado: l.estado,
      tipoContrato: l.tipoContrato,
      procedimiento: l.procedimiento,
      tramitacion: l.tramitacion,
      presupuestoBase: this.safeDecimalToNumber(l.presupuestoBase),
      presupuestoConIva: this.safeDecimalToNumber(l.presupuestoConIva),
      cpvCodes: l.cpvCodes,
      ccaa: l.ccaa,
      provincia: l.provincia,
      municipio: l.municipio,
      fechaPublicacion: l.fechaPublicacion,
      fechaPresentacion: l.fechaPresentacion,
      fechaAdjudicacion: l.fechaAdjudicacion,
      fechaFormalizacion: l.fechaFormalizacion,
      // ── DATOS SENSIBLES - ENMASCARADOS ──
      adjudicatarioNombre: l.adjudicatarioNombre,
      adjudicatarioNif: this.maskNif(l.adjudicatarioNif ?? undefined),
      importeAdjudicacion: this.safeDecimalToNumber(l.importeAdjudicacion),
      porcentajeBaja: l.porcentajeBaja,
      numLicitadores: l.numLicitadores,
      tieneLotes: l.tieneLotes,
      documentos: l.documentos,
      resumenIA: l.resumenIA,
      organo: l.organo
        ? {
            id: l.organo.id,
            externalId: l.organo.externalId,
            nombre: l.organo.nombre,
            tipo: l.organo.tipo,
            ccaa: l.organo.ccaa,
            web: l.organo.web,
          }
        : null,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    };

    return this.maskSensitiveData(detail);
  }

  /**
   * Enmascarar NIF: 12345678X -> 12345***
   * Mantiene primeros dígitos para identificación, oculta el resto.
   */
  maskNif(nif?: string): string | undefined {
    if (!nif) {
      return undefined;
    }

    // Validar formato mínimo
    if (nif.length < 6) {
      return '***';
    }

    // Mostrar primeros 5 caracteres, ocultar el resto
    return nif.slice(0, 5) + '*'.repeat(Math.max(1, nif.length - 5));
  }

  /**
   * Enmascara datos sensibles en el objeto.
   * Actualmente solo procesa NIFs, puede extenderse.
   *
   * Acepta cualquier objeto; si tiene la propiedad `adjudicatarioNif`,
   * la enmascara. Si no la tiene, devuelve el objeto sin cambios.
   */
  maskSensitiveData<T extends Record<string, unknown>>(data: T): T {
    if (
      'adjudicatarioNif' in data &&
      typeof data.adjudicatarioNif === 'string'
    ) {
      (data as Record<string, unknown>).adjudicatarioNif = this.maskNif(
        data.adjudicatarioNif,
      );
    }
    return data;
  }

  /**
   * Convierte Decimal a Number de forma segura.
   * TypeORM puede devolver Decimal, string o number. Esta función
   * normaliza todos esos casos a number (o null si no hay valor).
   */
  safeDecimalToNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    try {
      // Si es objeto Decimal de TypeORM (decimal.js o similar)
      if (isDecimalLike(value)) {
        return value.toNumber();
      }

      // Si es string o número
      const num = Number(value);
      return isNaN(num) ? null : num;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      console.warn(
  `Error converting value to number: ${JSON.stringify(value)} (${message})`,
);
      return null;
    }
  }
}