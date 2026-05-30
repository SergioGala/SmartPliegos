import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Licitacion } from '../../scraping/shared/entities/licitacion.entity';
import { AiService } from '../../ai/ai.service';
import type { LLMCompletionResult } from '../../../infrastructure/ai/ai.types';

@Injectable()
export class LicitacionResumenService {
  private readonly logger = new Logger(LicitacionResumenService.name);

  constructor(
    @InjectRepository(Licitacion)
    private readonly licRepo: Repository<Licitacion>,
    private readonly ai: AiService,
  ) {}

  /**
   * Devuelve el resumen IA de la licitación.
   * - Si ya está cacheado en `resumenIA`, lo devuelve sin llamar al LLM.
   * - Si no, lo genera con AiService.complete(), lo guarda en BD y lo devuelve.
   * - `force=true` regenera aunque haya uno cacheado (por si el prompt mejoró).
   */
  async getOrCreate(
    id: string,
    force = false,
  ): Promise<{ resumenIA: string; cached: boolean }> {
    const lic = await this.licRepo.findOne({
      where: { id },
      relations: ['organo'],
    });
    if (!lic) throw new NotFoundException(`Licitación ${id} no encontrada`);

    // Cache hit: no llamamos al LLM (ahorra latencia y dinero).
    if (lic.resumenIA && !force) {
      return { resumenIA: lic.resumenIA, cached: true };
    }

    const system =
      'Eres un experto en contratación pública española. Resume licitaciones para ' +
      'que una empresa decida en 20 segundos si le interesa presentarse. Tono claro y directo, ' +
      'sin relleno. Máximo 4 frases. No inventes datos que no estén en la información dada.';

    const user = this.buildPrompt(lic);

    let result: LLMCompletionResult;
    try {
      result = await this.ai.complete({
        system,
        user,
        maxTokens: 300,
        temperature: 0.3,
      });
    } catch (e) {
      this.logger.error(
        `Fallo generando resumen IA de ${id}: ${(e as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'El servicio de IA no está disponible ahora mismo',
      );
    }

    lic.resumenIA = result.text.trim();
    lic.pliegosProcesados = true;
    await this.licRepo.save(lic);

    this.logger.log(
      `Resumen IA generado para ${id} (${result.outputTokens} tokens, modelo: ${result.model})`,
    );
    return { resumenIA: lic.resumenIA, cached: false };
  }

  /**
   * Construye el prompt usando SOLO campos reales de la entidad.
   * Importante: nada que no esté en la entidad puede aparecer en el prompt
   * (evita que el LLM "rellene" con info inventada).
   */
  private buildPrompt(l: Licitacion): string {
    const money = (v: string | null): string =>
      v ? `${(Number(v) / 100).toLocaleString('es-ES')} €` : 'no indicado';
    const fecha = (d: Date | null): string =>
      d ? new Date(d).toLocaleDateString('es-ES') : 'no indicada';

    return [
      `Título: ${l.title}`,
      l.description ? `Objeto: ${l.description}` : '',
      `Órgano: ${l.organo?.nombre ?? 'no indicado'}`,
      `Ubicación: ${[l.municipio, l.provincia, l.ccaa].filter(Boolean).join(', ') || 'no indicada'}`,
      `Tipo de contrato: ${l.tipoContrato ?? 'no indicado'}`,
      `Procedimiento: ${l.procedimiento ?? 'no indicado'}`,
      `Presupuesto base: ${money(l.presupuestoBase)}`,
      `CPV: ${l.cpvCodes?.join(', ') || 'no indicado'}`,
      `Fecha límite de presentación: ${fecha(l.fechaPresentacion)}`,
    ]
      .filter(Boolean)
      .join('\n');
  }
}