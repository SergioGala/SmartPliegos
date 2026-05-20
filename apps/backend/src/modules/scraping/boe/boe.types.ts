export interface BoeSumarioResponse {
  status?: { code: string; text: string };
  data?: BoeSumarioData;
}

export interface BoeSumarioData {
  sumario: {
    metadatos: { publicacion: string; fecha_publicacion: string };
    diario: BoeDiario[];
  };
}

export interface BoeDiario {
  sumario_diario: { identificador: string };
  seccion: BoeSeccion[];
}

export interface BoeSeccion {
  codigo: string;
  nombre: string;
  departamento?: BoeDepartamento[];
}

export interface BoeDepartamento {
  codigo: string;
  nombre: string;
  epigrafe?: BoeEpigrafe[];
  item?: BoeItem[];
}

export interface BoeEpigrafe {
  nombre: string;
  item: BoeItem[];
}

export interface BoeItem {
  identificador: string;
  titulo: string;
  url_pdf?: { texto: string };
  url_xml?: string;
  url_html?: string;
}

export interface BoeParsedDisposicion {
  externalId: string;
  titulo: string;
  departamentoCodigo: string;
  departamentoNombre: string;
  epigrafeNombre: string | null;
  urlPdf: string | null;
  urlXml: string | null;
  urlHtml: string | null;
  fechaPublicacion: Date;
}
