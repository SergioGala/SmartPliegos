import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Test e2e del flow de signup + envío de email.
 *
 * Levanta el backend completo (todos los módulos), hace una request HTTP
 * real al endpoint de signup, y verifica que la respuesta es correcta.
 * Como efecto secundario, Resend envía un email REAL a TEST_RECIPIENT_EMAIL.
 *
 * Requisitos para ejecutar este test:
 *   - Backend con RESEND_API_KEY válida en .env.
 *   - Variable TEST_RECIPIENT_EMAIL apuntando a un email accesible.
 *
 * Por defecto está marcado .skip para que NO corra en CI o en npm test
 * normal. CI no tiene credenciales de Resend ni acceso a un inbox.
 *
 * Para ejecutarlo manualmente:
 *   1. Eliminar el .skip temporalmente (cambiar describe.skip por describe).
 *   2. Asegurar TEST_RECIPIENT_EMAIL en .env.
 *   3. Correr: npm run test:e2e -- --testNamePattern="email-flow"
 *   4. Revisar inbox.
 *   5. Volver a poner .skip.
 */
describe.skip('Email flow (e2e, requires real Resend)', () => {
  let app: INestApplication;
  let testRecipient: string;

  beforeAll(async () => {
    testRecipient = process.env.TEST_RECIPIENT_EMAIL ?? '';
    if (!testRecipient) {
      throw new Error(
        'TEST_RECIPIENT_EMAIL not set. Add it to your .env to run this test.',
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/signup creates user and triggers verification email', async () => {
    // Plus-addressing en Gmail: test+xxx@gmail.com llega al mismo inbox de test@gmail.com.
    // Esto evita colisiones con usuarios existentes en BD si el test corre varias veces.
    const [localPart, domain] = testRecipient.split('@');
    const uniqueEmail = `${localPart}+sprint11-${Date.now()}@${domain}`;

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: uniqueEmail,
        firstName: 'TestUser',
        lastName: 'Sprint11',
      })
      .expect(201);

    // El interceptor global envuelve respuestas en { success, data, timestamp, path }
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data.message');
    expect(typeof response.body.data.message).toBe('string');

    // Verificación humana: revisar la bandeja de entrada de testRecipient.
    console.log(
      `\n✉️  Email enviado a ${uniqueEmail} (llega al inbox de ${testRecipient}). Comprueba la bandeja de entrada.\n`,
    );
  }, 30_000);
});