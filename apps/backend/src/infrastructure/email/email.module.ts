import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MAIL_PROVIDER } from './providers/mail-provider.interface';
import { ResendMailProvider } from './providers/resend-mail.provider';

/**
 * Módulo de email.
 *
 * Expone EmailService para que cualquier feature pueda enviar emails
 * sin conocer al proveedor concreto.
 *
 * Para cambiar de proveedor:
 *   1. Crear una nueva clase que implemente IMailProvider.
 *   2. Cambiar el binding `useClass: ResendMailProvider` por la nueva clase.
 *   3. NADA MÁS. Los consumers (auth, users, alerts, invitations) no se tocan.
 *
 * Esto es el "punto de configuración" que el patrón Strategy nos da gratis.
 */
@Module({
  providers: [
    {
      // Cuando alguien pida MAIL_PROVIDER, dale una instancia de ResendMailProvider.
      // NestJS gestiona el ciclo de vida (singleton: una sola instancia
      // compartida por toda la app).
      provide: MAIL_PROVIDER,
      useClass: ResendMailProvider,
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}