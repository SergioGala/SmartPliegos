import { Injectable, Logger } from '@nestjs/common';
import type {
  IMailProvider,
  MailProviderResult,
  SendEmailParams,
} from './mail-provider.interface';

export interface CapturedEmail extends SendEmailParams {
  sentAt: Date;
  messageId: string;
}

/**
 * Mail provider en memoria. Útil para:
 *   - Tests (unit + e2e): aserciones sobre lo que se ha enviado.
 *   - Dev local sin red: ver qué se enviaría sin tocar Resend.
 *
 * No envía nada. Solo acumula los emails en un array.
 *
 * Para activarlo: MAIL_PROVIDER_TYPE=memory en el env.
 */
@Injectable()
export class InMemoryMailProvider implements IMailProvider {
  public readonly providerName = 'in-memory';
  private readonly logger = new Logger(InMemoryMailProvider.name);
  private readonly sent: CapturedEmail[] = [];
  private counter = 0;

  // Aceptamos el params del provider y guardamos sin tocar nada externo.
  // eslint-disable-next-line @typescript-eslint/require-await
  async sendEmail(params: SendEmailParams): Promise<MailProviderResult> {
    this.counter += 1;
    const messageId = `inmem-${Date.now()}-${this.counter}`;
    this.sent.push({ ...params, sentAt: new Date(), messageId });
    this.logger.debug(
      `(memory) email captured to=${JSON.stringify(params.to)} subject="${params.subject}"`,
    );
    return { messageId, provider: this.providerName };
  }

  /** Devuelve copia del histórico. Útil en tests. */
  getSentEmails(): CapturedEmail[] {
    return [...this.sent];
  }

  /** Vacía el histórico. Útil entre tests. */
  clear(): void {
    this.sent.length = 0;
    this.counter = 0;
  }
}