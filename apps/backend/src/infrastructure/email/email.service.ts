import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MAIL_PROVIDER } from './providers/mail-provider.interface';
import type { IMailProvider } from './providers/mail-provider.interface';
import { SendEmailDto } from './email.interface';

/**
 * Servicio de email de alto nivel.
 *
 * Encapsula la lógica de "qué se envía" (templates, asuntos, URLs absolutas)
 * y delega el "cómo se envía" al IMailProvider inyectado.
 *
 * Para cambiar de proveedor (ej. de Resend a SES), modificar SOLO el
 * binding en EmailModule. Este servicio NO cambia.
 *
 * Esta clase es el principal consumidor de la abstracción IMailProvider.
 * Es el caso de uso clásico del patrón Strategy: alta cohesión interna,
 * bajo acoplamiento con el proveedor concreto.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /**
   * Constructor.
   *
   * @Inject(MAIL_PROVIDER) le dice a NestJS:
   *   "Lo que esté registrado bajo el token MAIL_PROVIDER, inyéctalo aquí
   *    como mailProvider".
   *
   * Como MAIL_PROVIDER es un Symbol (no una clase concreta), NestJS necesita
   * el @Inject explícito. Si fuera una clase, bastaría con tipar el
   * parámetro y NestJS la resolvería sola.
   */
  constructor(
    @Inject(MAIL_PROVIDER) private readonly mailProvider: IMailProvider,
    private readonly configService: ConfigService,
  ) {
    this.logger.log(
      `EmailService initialized with provider: ${mailProvider.providerName}`,
    );
  }

  /**
   * Envía un email genérico. Casi todos los demás métodos delegan en este.
   *
   * Si el envío falla, lanza InternalServerErrorException (que NestJS
   * traducirá a HTTP 500 si esto se llama desde un controller).
   *
   * Razón de envolver el error: el caller no debe ver detalles internos
   * del provider (que podrían filtrar info). Solo "no pude enviar el email".
   */
  async sendEmail(emailDto: SendEmailDto): Promise<void> {
    try {
      await this.mailProvider.sendEmail({
        to: emailDto.to,
        subject: emailDto.subject,
        html: emailDto.html,
        text: emailDto.text,
        from: emailDto.from,
        replyTo: emailDto.replyTo,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      // Loguear el error real internamente (con stack trace)...
      this.logger.error(
        `Failed to send email: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      // ...pero al caller le mostramos un mensaje genérico.
      throw new InternalServerErrorException(
        `Failed to send email: ${message}`,
      );
    }
  }

  /**
   * Email de bienvenida tras signup completo.
   *
   * NOTA: las plantillas HTML inline (escritas con strings) se refactorizan
   * en Fase 2 del roadmap. Por ahora son strings concatenados, lo cual NO
   * es ideal pero funciona.
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL') ?? '';
    const html = `
      <h1>Bienvenido a SmartPliegos, ${firstName}!</h1>
      <p>Tu cuenta ha sido creada exitosamente.</p>
      <p>Haz clic en el siguiente enlace para confirmar tu email:</p>
      <a href="${appUrl}/verify-email">Confirmar email</a>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Bienvenido a SmartPliegos',
      html,
      text: `Bienvenido a SmartPliegos, ${firstName}!`,
    });
  }

  /**
   * Email de reset de contraseña con token.
   *
   * El token es una cadena aleatoria que el backend genera al recibir la
   * petición de reset. Cuando el usuario hace click en el enlace, llega
   * a /reset-password?token=XXX y el frontend lo manda al backend para
   * verificar antes de permitirle cambiar la contraseña.
   *
   * El token expira en 1 hora (lógica en users.service).
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL') ?? '';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    const html = `
      <h1>Restablecer contraseña</h1>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href="${resetUrl}">Restablecer contraseña</a>
      <p>Este enlace expira en 1 hora.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Restablecer tu contraseña en SmartPliegos',
      html,
      text: 'Haz clic en el enlace para restablecer tu contraseña',
    });
  }

  /**
   * Email de invitación a unirse a una organización.
   *
   * Cuando un Admin de una organización invita a alguien por email,
   * se genera un token único y se envía un link a /join-organization?token=XXX.
   * Si el invitado hace click, llega a la app con la invitación pendiente
   * y solo tiene que aceptarla.
   */
  async sendInvitationEmail(
    email: string,
    organizationName: string,
    inviteToken: string,
  ): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL') ?? '';
    const inviteUrl = `${appUrl}/join-organization?token=${inviteToken}`;

    const html = `
      <h1>Invitación a unirse a ${organizationName}</h1>
      <p>Has sido invitado a unirte a ${organizationName} en SmartPliegos.</p>
      <p>Haz clic en el siguiente enlace para aceptar la invitación:</p>
      <a href="${inviteUrl}">Aceptar invitación</a>
    `;

    await this.sendEmail({
      to: email,
      subject: `Invitación a unirse a ${organizationName}`,
      html,
      text: `Has sido invitado a unirte a ${organizationName}`,
    });
  }
}