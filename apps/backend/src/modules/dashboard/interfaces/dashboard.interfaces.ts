export interface DashboardSummary {
  favoritos: number;
  venciendoEn7Dias: number;
  recordatoriosPendientes: number;
  nuevasEstaSemana: number;
}

export interface VencimientoItem {
  licitacionId: string;
  title: string;
  organo: string | null;
  fechaPresentacion: string;
  diasRestantes: number;
  presupuestoBase: string | null;
}

export interface DistribucionBucket {
  key: string;
  count: number;
}

export interface Distribucion {
  porTipoContrato: DistribucionBucket[];
  porCcaa: DistribucionBucket[];
}

export interface SeriePunto {
  semana: string;
  total: number;
  enMisCcaa: number;
}