import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { MAIL_PROVIDER } from './providers/mail-provider.interface';
import { InMemoryMailProvider } from './providers/in-memory-mail.provider';

describe('EmailService (with InMemoryMailProvider)', () => {
  let service: EmailService;
  let provider: InMemoryMailProvider;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              APP_URL: 'http://app.test',
              MAIL_PROVIDER_TYPE: 'memory',
            }),
          ],
        }),
      ],
      providers: [
        EmailService,
        InMemoryMailProvider,
        {
          provide: MAIL_PROVIDER,
          useExisting: InMemoryMailProvider,
        },
      ],
    }).compile();

    service = moduleRef.get(EmailService);
    provider = moduleRef.get(InMemoryMailProvider);
    provider.clear();
  });

  it('sendEmail captures the message in the in-memory provider', async () => {
    await service.sendEmail({
      to: 'user@test.dev',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });

    const sent = provider.getSentEmails();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('user@test.dev');
    expect(sent[0].subject).toBe('Hello');
    expect(sent[0].html).toBe('<p>Hi</p>');
  });

  it('sendWelcomeEmail builds the welcome template with appUrl', async () => {
    await service.sendWelcomeEmail('newuser@test.dev', 'Ana');

    const [email] = provider.getSentEmails();
    expect(email.subject).toBe('Bienvenido a SmartPliegos');
    expect(email.html).toContain('Ana');
    expect(email.html).toContain('http://app.test/verify-email');
  });

  it('sendPasswordResetEmail embeds the token in the reset URL', async () => {
    await service.sendPasswordResetEmail('reset@test.dev', 'tok-123');

    const [email] = provider.getSentEmails();
    expect(email.html).toContain('http://app.test/reset-password?token=tok-123');
    expect(email.subject).toContain('Restablecer');
  });

  it('sendInvitationEmail includes org name and token URL', async () => {
    await service.sendInvitationEmail('invitee@test.dev', 'Acme Corp', 'inv-9');

    const [email] = provider.getSentEmails();
    expect(email.html).toContain('Acme Corp');
    expect(email.html).toContain('http://app.test/join-organization?token=inv-9');
  });

  it('throws InternalServerErrorException when provider throws', async () => {
    const failing = {
      providerName: 'failing',
      sendEmail: jest.fn().mockRejectedValue(new Error('SMTP down')),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: MAIL_PROVIDER, useValue: failing },
        ConfigService,
      ],
    }).compile();

    const failingService = moduleRef.get(EmailService);
    await expect(
      failingService.sendEmail({
        to: 'x@test',
        subject: 's',
        html: 'h',
      }),
    ).rejects.toThrow(/Failed to send email/);
  });
});