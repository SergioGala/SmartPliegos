import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { config } from '../../config/env.config';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

export function recordatorioTemplate(lic: Licitacion, daysBefore: number): string {
  const url = `${config.frontendUrl}/licitaciones/${lic.id}`;
  const deadline = lic.fechaPresentacion
    ? new Date(lic.fechaPresentacion).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
    : '—';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color:#333; border-bottom:2px solid #007bff; padding-bottom:10px;">⏰ Recordatorio de plazo</h2>
      <p>El plazo de presentación vence en <strong>${daysBefore} día(s)</strong>:</p>
      <p style="background:#e7f3ff; padding:15px; border-radius:5px; border-left:4px solid #007bff;">
        <strong>${escapeHtml(lic.title ?? '')}</strong>
      </p>
      <p><strong>Fecha límite:</strong> ${deadline}</p>
      <div style="text-align:center; margin:30px 0;">
        <a href="${url}" style="background:#007bff; color:#fff; padding:12px 24px; text-decoration:none; border-radius:5px; font-weight:bold;">
          Ver licitación
        </a>
      </div>
      <p style="color:#999; font-size:12px; text-align:center;">© 2026 SmartPliegos</p>
    </div>
  `;
}