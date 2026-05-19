import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { MAIL_PROVIDER } from './providers/mail-provider.interface';
import { ResendMailProvider } from './providers/resend-mail.provider';
import { InMemoryMailProvider } from './providers/in-memory-mail.provider';

@Module({
  providers: [
    ResendMailProvider,
    InMemoryMailProvider,
    {
      provide: MAIL_PROVIDER,
      inject: [ConfigService, ResendMailProvider, InMemoryMailProvider],
      useFactory: (
        config: ConfigService,
        resend: ResendMailProvider,
        memory: InMemoryMailProvider,
      ) => {
        const type = config.get<string>('MAIL_PROVIDER_TYPE') ?? 'resend';
        return type === 'memory' ? memory : resend;
      },
    },
    EmailService,
  ],
  exports: [EmailService, InMemoryMailProvider],
})
export class EmailModule {}