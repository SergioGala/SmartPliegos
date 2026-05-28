// ═══════════════════════════════════════════════
// CPV — Familias más comunes (2 primeros dígitos)
// ═══════════════════════════════════════════════

const CPV_FAMILIES: Record<string, string> = {
  '03': 'Productos agrícolas y ganaderos',
  '09': 'Productos petrolíferos y combustibles',
  '14': 'Productos de minería y canteras',
  '15': 'Alimentos, bebidas y tabaco',
  '18': 'Prendas de vestir y accesorios',
  '22': 'Material impreso y productos relacionados',
  '24': 'Productos químicos',
  '30': 'Máquinas y equipos de oficina (excepto informáticos)',
  '31': 'Equipos eléctricos y componentes',
  '32': 'Equipos de radio, TV y comunicaciones',
  '33': 'Equipos médicos y farmacéuticos',
  '34': 'Equipos de transporte y productos auxiliares',
  '35': 'Equipos de seguridad y defensa',
  '37': 'Instrumentos musicales, deportivos y juegos',
  '38': 'Equipos de laboratorio, ópticos y de precisión',
  '39': 'Mobiliario y equipamiento',
  '41': 'Agua recogida y depurada',
  '42': 'Maquinaria industrial',
  '43': 'Maquinaria para minería y canteras',
  '44': 'Estructuras y materiales de construcción',
  '45': 'Trabajos de construcción',
  '48': 'Paquetes de software y sistemas de información',
  '50': 'Servicios de reparación y mantenimiento',
  '51': 'Servicios de instalación',
  '55': 'Servicios de hostelería y restauración',
  '60': 'Servicios de transporte terrestre',
  '63': 'Servicios de transporte complementarios',
  '64': 'Servicios postales y de telecomunicaciones',
  '65': 'Suministros públicos (agua, energía, calefacción)',
  '66': 'Servicios financieros y de seguros',
  '70': 'Servicios inmobiliarios',
  '71': 'Servicios de arquitectura, ingeniería y planificación',
  '72': 'Servicios de TI: consultoría, desarrollo y soporte',
  '73': 'Servicios de investigación y desarrollo',
  '75': 'Servicios de administración pública y defensa',
  '76': 'Servicios relacionados con petróleo y gas',
  '77': 'Servicios agrícolas, forestales y de jardinería',
  '79': 'Servicios empresariales: legal, marketing, consultoría',
  '80': 'Servicios de enseñanza y formación',
  '85': 'Servicios de salud y asistencia social',
  '90': 'Servicios de alcantarillado, residuos y limpieza',
  '92': 'Servicios recreativos, culturales y deportivos',
  '98': 'Otros servicios comunitarios y personales',
};

/**
 * Devuelve la descripción legible de un código CPV.
 * Busca por los 2 primeros dígitos (familia) en el mapa estático.
 * Si no encuentra coincidencia, devuelve el propio código.
 */
export function cpvLabel(code: string | null | undefined): string {
  if (!code || code.length < 2) return code ?? '';
  const family = code.slice(0, 2);
  return CPV_FAMILIES[family] ?? code;
}

// ═══════════════════════════════════════════════
// Formateo de números y fechas
// ═══════════════════════════════════════════════

export function formatMoney(cents: string | number | null | undefined): string {
  if (cents === null || cents === undefined) return '—';
  const n = typeof cents === 'string' ? parseFloat(cents) : cents;
  if (isNaN(n)) return '—';
  const euros = n / 100;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(euros);
}

/**
 * Importe compacto. Devuelve OBJETO con { num, unit } para que sea
 * retrocompatible con la página de detalle y se pueda renderizar con
 * jerarquía tipográfica (número grande, unidad pequeña).
 *
 * También expone `.toString()` → "120K €" para usos rápidos.
 */
export interface CompactMoney {
  num: string;
  unit: string;
  toString(): string;
}

export function formatMoneyCompact(
  cents: string | number | null | undefined,
): CompactMoney {
  const empty: CompactMoney = {
    num: '—',
    unit: '',
    toString() {
      return '—';
    },
  };

  if (cents === null || cents === undefined) return empty;
  const n = typeof cents === 'string' ? parseFloat(cents) : cents;
  if (isNaN(n) || n === 0) return empty;

  const euros = n / 100;
  let num: string;
  let unit: string;

  if (euros >= 1_000_000) {
    num = (euros / 1_000_000).toFixed(1).replace(/\.0$/, '');
    unit = 'M €';
  } else if (euros >= 1_000) {
    num = String(Math.round(euros / 1_000));
    unit = 'K €';
  } else {
    num = String(Math.round(euros));
    unit = '€';
  }

  return {
    num,
    unit,
    toString() {
      return `${num}${unit.startsWith(' ') ? '' : ' '}${unit}`.trim();
    },
  };
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Fecha con hora. Necesario para la página de detalle. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Días hasta la fecha dada. Devuelve OBJETO con { days, text, urgent, expired }
 * para retrocompatibilidad con la página de detalle.
 *
 * `urgent` = true si quedan ≤ 7 días (incluido vencido).
 * `expired` = true si la fecha ya pasó.
 * Accede al número entero con `.days` o castea con `Number(daysUntil(...))`.
 */
export interface DaysUntilResult {
  days: number | null;
  text: string;
  urgent: boolean;
  expired: boolean;
  /** Permite usar el resultado como número */
  valueOf(): number;
}

export function daysUntil(iso: string | null | undefined): DaysUntilResult {
  const empty: DaysUntilResult = {
    days: null,
    text: '—',
    urgent: false,
    expired: false,
    valueOf() {
      return -1;
    },
  };

  if (!iso) return empty;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return empty;

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();

  if (diffMs < 0) {
    // Plazo vencido: devolvemos días negativos
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return {
      days,
      text: 'Vencido',
      urgent: true,
      expired: true,
      valueOf() {
        return days;
      },
    };
  }

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    days,
    text: days === 0 ? 'Hoy' : days === 1 ? '1 día' : `${days} días`,
    urgent: days <= 7,
    expired: false,
    valueOf() {
      return days;
    },
  };
}

// ═══════════════════════════════════════════════
// Estado de licitación — tokens visuales
// ═══════════════════════════════════════════════

export interface EstadoConfig {
  label: string;
  /** Clase para la barra lateral sólida */
  bar: string;
  /** Clase para el color del dot indicador */
  dot: string;
  /** Clase para el texto del estado */
  text: string;
  /** Clase compuesta para el badge (bg + text) */
  badge: string;
  /** Anima pulse si es estado "vivo" (ABIERTA) */
  pulse: boolean;
  /** LEGACY: alias de badge para código antiguo */
  classes: string;
  priority: number;
}

function make(opts: {
  label: string;
  bar: string;
  dot: string;
  text: string;
  badge: string;
  pulse?: boolean;
  priority: number;
}): EstadoConfig {
  return {
    ...opts,
    pulse: opts.pulse ?? false,
    classes: opts.badge, // legacy alias
  };
}

export const ESTADO_CONFIG: Record<string, EstadoConfig> = {
  ABIERTA: make({
    label: 'Abierta',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    pulse: true,
    priority: 0,
  }),
  ADJUDICADA: make({
    label: 'Adjudicada',
    bar: 'bg-primary',
    dot: 'bg-primary',
    text: 'text-primary',
    badge: 'bg-primary/10 text-primary border-primary/20',
    priority: 1,
  }),
  RESUELTA: make({
    label: 'Resuelta',
    bar: 'bg-slate-400',
    dot: 'bg-slate-400',
    text: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    priority: 4,
  }),
  CERRADA: make({
    label: 'Cerrada',
    bar: 'bg-slate-400',
    dot: 'bg-slate-400',
    text: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    priority: 3,
  }),
  DESIERTA: make({
    label: 'Desierta',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    priority: 2,
  }),
  ANULADA: make({
    label: 'Anulada',
    bar: 'bg-red-500/70',
    dot: 'bg-red-500/70',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    priority: 5,
  }),
  ANUNCIO_PREVIO: make({
    label: 'Anuncio previo',
    bar: 'bg-blue-500',
    dot: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    priority: 1,
  }),
  DESCONOCIDO: make({
    label: 'Sin estado',
    bar: 'bg-muted-foreground/30',
    dot: 'bg-muted-foreground/50',
    text: 'text-muted-foreground',
    badge: 'bg-muted text-muted-foreground border-border',
    priority: 6,
  }),
};

export function getEstadoConfig(
  estado: string | null | undefined,
): EstadoConfig {
  if (!estado) return ESTADO_CONFIG.DESCONOCIDO;
  return ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.DESCONOCIDO;
}

/** LEGACY alias */
export function getEstadoStyle(
  estado: string | null | undefined,
): EstadoConfig {
  return getEstadoConfig(estado);
}

// ═══════════════════════════════════════════════
// Utilidades de formato
// ═══════════════════════════════════════════════

export function prettyEnum(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function formatLocation(
  municipio?: string | null,
  provincia?: string | null,
  ccaa?: string | null,
): string | null {
  const parts = [municipio, provincia, ccaa].filter(Boolean) as string[];
  const unique = Array.from(new Set(parts));
  if (unique.length === 0) return null;
  return unique.slice(0, 2).join(' · ');
}
/**
 * Texto traducido del deadline. Se mantiene `daysUntil()` intacto (que sigue
 * devolviendo `text` en español) para no romper la página de detalle, que
 * lo usa con su propio formato. Esta función se llama explícitamente desde
 * componentes ya migrados a i18n.
 *
 * @param days  número de días devuelto por `daysUntil(...).days`
 * @param t     `useTranslation('search').t` del componente que llama
 */
export function deadlineLabel(
  days: number | null,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (days === null) return '—';
  if (days < 0) return t('card.deadlineExpired', { defaultValue: 'Vencido' });
  if (days === 0) return t('card.deadlineToday');
  if (days === 1) return t('card.deadlineOneDay');
  return t('card.deadlineDays', { count: days });
}

// ═══════════════════════════════════════════════
// Enlace a la fuente original (PLACE / BOE)
// ═══════════════════════════════════════════════

/**
 * Construye la URL de la plataforma original a partir del source y externalId.
 * Devuelve null si no hay datos suficientes para construirla.
 */
export function getExternalSourceUrl(
  source: string | null | undefined,
  externalId: string | null | undefined,
): string | null {
  if (!source || !externalId) return null;

  const s = source.toUpperCase();
  if (s === 'PLACE') {
    return `https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvn=${encodeURIComponent(externalId)}`;
  }
  if (s === 'BOE') {
    return `https://www.boe.es/buscar/doc.php?id=${encodeURIComponent(externalId)}`;
  }

  return null;
}