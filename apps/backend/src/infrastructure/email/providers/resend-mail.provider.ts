import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  IMailProvider,
  MailProviderResult,
  SendEmailParams,
} from './mail-provider.interface';

/**
 * Implementación de IMailProvider usando Resend.
 *
 * Lee la configuración (API key, email "from") desde variables de
 * entorno mediante el ConfigService de NestJS.
 *
 * Configuración requerida en .env:
 *   - RESEND_API_KEY: API key del panel Resend (empieza por "re_").
 *   - RESEND_FROM_EMAIL: email "from" por defecto.
 *     En dev usar 'onboarding@resend.dev' (no requiere verificar dominio).
 *
 * Si falta RESEND_API_KEY, el constructor lanza error y NestJS aborta
 * el bootstrap del backend. Esto es FAIL-FAST: mejor error claro al
 * arrancar que bug raro 3 horas después.
 */
@Injectable()
export class ResendMailProvider implements IMailProvider {
  /** Identificador legible del provider. Aparece en logs. */
  public readonly providerName = 'resend';

  /** Logger de NestJS. Cada clase tiene su propio Logger con su nombre,
   *  así en los logs ves `[ResendMailProvider] mensaje` y sabes de dónde
   *  viene. */
  private readonly logger = new Logger(ResendMailProvider.name);

  /** Cliente del SDK de Resend. Lo creamos una vez en el constructor
   *  y lo reutilizamos para todos los envíos. */
  private readonly client: Resend;

  /** Email "from" por defecto si quien llama no especifica uno. */
  private readonly defaultFrom: string;

  /**
   * Constructor del provider.
   *
   * NestJS detecta que necesita un ConfigService (gracias al type del
   * parámetro) y se lo inyecta automáticamente. Esto es DI en acción.
   */
  constructor(private readonly configService: ConfigService) {
    // Lee la API key desde process.env via ConfigService
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    // Fail-fast: si no hay API key, el backend no debe arrancar.
    // Mejor un error claro aquí que un envío fallido en producción.
    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY is not defined. Add it to your .env file. ' +
          'Get a key from https://resend.com/api-keys',
      );
    }

    // Crear instancia del cliente Resend.
    // El SDK guarda la API key internamente; cada llamada la incluye
    // en los headers HTTP.
    this.client = new Resend(apiKey);

    // Email "from" por defecto. Si no está configurado, usamos el
    // sandbox de Resend que funciona sin verificar dominio.
    this.defaultFrom =
      this.configService.get<string>('RESEND_FROM_EMAIL') ??
      'onboarding@resend.dev';

    this.logger.log(
      `ResendMailProvider initialized (from: ${this.defaultFrom})`,
    );
  }

  /**
   * Envía un email vía Resend.
   *
   * Pasos:
   * 1. Normaliza el destinatario a array (Resend acepta string o array,
   *    pero pasamos siempre array por consistencia interna).
   * 2. Llama al SDK con los parámetros mapeados.
   * 3. El SDK devuelve { data, error }: si error existe, falló;
   *    si no, data.id contiene el messageId.
   * 4. Loguea el resultado y devuelve.
   *
   * Si algo falla (red, API key inválida, dominio no verificado,
   * destinatario inválido), lanza el error para que el caller decida.
   */
  async sendEmail(params: SendEmailParams): Promise<MailProviderResult> {
    // Normalizar a array de destinatarios
    const recipients = Array.isArray(params.to) ? params.to : [params.to];

    try {
      // Llamada al SDK de Resend.
      // Importante: la API de Resend v6 usa camelCase (replyTo, no reply_to).
      const result = await this.client.emails.send({
        from: params.from ?? this.defaultFrom,
        to: recipients,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo,
      });

      // El SDK de Resend devuelve { data: { id }, error } en lugar
      // de lanzar excepciones directamente. Por eso comprobamos manualmente.
      if (result.error) {
        const errorMessage = result.error.message ?? 'Unknown Resend error';
        this.logger.error(
          `Resend rejected email to ${recipients.join(', ')}: ${errorMessage}`,
          JSON.stringify(result.error),
        );
        throw new Error(`Email provider error: ${errorMessage}`);
      }

      // Éxito. Sacamos el messageId para el log y el return.
      const messageId = result.data?.id ?? 'unknown';
      this.logger.log(
        `Email sent via Resend to ${recipients.join(', ')} (messageId: ${messageId})`,
      );

      return {
        messageId,
        provider: this.providerName,
      };
    } catch (error) {
      // Errores que no son del API de Resend (red, DNS, timeouts, etc.)
      // caen aquí.
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send email via Resend: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Re-lanzamos para que el caller decida (retry, etc.)
      throw error;
    }
  }
}