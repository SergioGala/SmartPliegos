import { Licitacion } from '../../scraping/shared/entities/licitacion.entity';

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

export interface ILicitacionFormatter {
  /**
   * Formatea licitación para listado (campos limitados)
   * @param lic Licitación a formatear
   */
  formatList(lic: Licitacion): LicitacionListItemDto;

  /**
   * Formatea licitación para detalle (todos los campos)
   * @param lic Licitación a formatear
   */
  formatDetail(lic: Licitacion): LicitacionDetailDto;

  /**
   * Enmascara datos sensibles (PII)
   * @param data Objeto con datos a enmascarar
   */
  maskSensitiveData<T extends Record<string, unknown>>(data: T): T;

  /**
   * Enmascarar NIF
   * @param nif NIF a enmascarar
   */
  maskNif(nif?: string): string | undefined;

  /**
   * Convierte Decimal a Number de forma segura
   * @param value Valor a convertir
   */
  safeDecimalToNumber(value: unknown): number | null;
}
