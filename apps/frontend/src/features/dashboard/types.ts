export interface DashboardSummary {
  favoritos: number;
  venciendoEn7Dias: number;
  recordatoriosPendientes: number;
  nuevasEstaSemana: number;
}

export interface DashboardVencimientoItem {
  licitacionId: string;
  title: string;
  organo: string | null;
  fechaPresentacion: string;
  diasRestantes: number;
  presupuestoBase: string | null;
}

export interface DashboardDistribucionBucket {
  key: string;
  count: number;
}

export interface DashboardDistribucion {
  porTipoContrato: DashboardDistribucionBucket[];
  porCcaa: DashboardDistribucionBucket[];
}

export interface DashboardSeriePunto {
  semana: string;
  total: number;
  enMisCcaa: number;
}
