import { Injectable, Logger } from '@nestjs/common';
import { BoeSumarioResponse, BoeParsedDisposicion } from './boe.types';

const SECCION_III_CODE = '3';

@Injectable()
export class BoeParserService {
  private readonly logger = new Logger(BoeParserService.name);

  parseSumario(response: BoeSumarioResponse): BoeParsedDisposicion[] {
    if (!response.data?.sumario?.diario?.length) {
      this.logger.debug('parseSumario: sumario sin diario, devuelvo []');
      return [];
    }

    const fechaPublicacionStr = response.data.sumario.metadatos.fecha_publicacion;
    const fechaPublicacion = this.parseFechaBoe(fechaPublicacionStr);

    const disposiciones: BoeParsedDisposicion[] = [];

    for (const diario of response.data.sumario.diario) {
      const seccionIII = diario.seccion.find((s) => s.codigo === SECCION_III_CODE);
      if (!seccionIII?.departamento) continue;

      for (const departamento of seccionIII.departamento) {
        for (const item of this.toArray(departamento.item)) {
          disposiciones.push(
            this.toDisposicion(item, departamento, null, fechaPublicacion),
          );
        }
        for (const epigrafe of departamento.epigrafe ?? []) {
          for (const item of this.toArray(epigrafe.item)) {
            disposiciones.push(
              this.toDisposicion(item, departamento, epigrafe.nombre, fechaPublicacion),
            );
          }
        }
      }
    }

    return disposiciones;
  }

  private toDisposicion(
    item: { identificador: string; titulo: string; url_pdf?: { texto: string }; url_xml?: string; url_html?: string },
    departamento: { codigo: string; nombre: string },
    epigrafeNombre: string | null,
    fechaPublicacion: Date,
  ): BoeParsedDisposicion {
    return {
      externalId: item.identificador,
      titulo: item.titulo,
      departamentoCodigo: departamento.codigo,
      departamentoNombre: departamento.nombre,
      epigrafeNombre,
      urlPdf: item.url_pdf?.texto ?? null,
      urlXml: item.url_xml ?? null,
      urlHtml: item.url_html ?? null,
      fechaPublicacion,
    };
  }

  private toArray<T>(value: T | T[] | undefined | null): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  private parseFechaBoe(fecha: string): Date {
    const [d, m, y] = fecha.split('/').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
}
