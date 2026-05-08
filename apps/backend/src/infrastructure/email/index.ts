/**
 * Barrel del módulo de email.
 *
 * Un "barrel" es un index.ts que re-exporta lo que vale la pena exponer
 * al resto del backend. Permite que otros archivos hagan:
 *
 *   import { EmailService } from 'src/infrastructure/email';
 *
 * en vez del path largo:
 *
 *   import { EmailService } from 'src/infrastructure/email/email.service';
 */

// Módulo NestJS — usado por otros módulos para registrar EmailModule en sus imports.
export { EmailModule } from './email.module';

// Servicio principal — lo que usan auth/users/alerts/invitations.
export { EmailService } from './email.service';

// DTO público — usado por quien construye llamadas a EmailService.sendEmail.
export type { SendEmailDto } from './email.interface';

// Token DI y interfaz — útil si otro módulo quiere inyectar IMailProvider directamente
// (ej. para mockearlo en tests).
export { MAIL_PROVIDER } from './providers/mail-provider.interface';
export type {
  IMailProvider,
  SendEmailParams,
  MailProviderResult,
} from './providers/mail-provider.interface';