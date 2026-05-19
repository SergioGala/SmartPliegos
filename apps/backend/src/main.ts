import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Sentry debe inicializarse ANTES que cualquier otro framework
// para poder capturar errores tempranos.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  enabled: !!process.env.SENTRY_DSN, // Solo activo si hay DSN configurada
  integrations: [nodeProfilingIntegration()],
  // Sample rate: porcentaje de transacciones a registrar.
  // En dev: 1 (todas). En prod: 0.1 (10%) para no exceder cuota gratuita.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});


import 'reflect-metadata';

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { morganMiddleware } from './config/morgan.config';
import { config } from './config/env.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { HttpAdapterHost } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
   // Sentry primero (captura 5xx), Http después (formatea respuesta)
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new SentryExceptionFilter(httpAdapter),
    new HttpExceptionFilter(),
  );

  // Aplicar Response Interceptor global
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Aplicar middleware de logging
  app.use(morganMiddleware);

  // Configurar CORS
  app.enableCors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cache-Control',
      'Pragma',
    ],
  });

  // Configurar prefijo global de rutas (excluir health)
  app.setGlobalPrefix(`${config.api.prefix}/${config.api.version}`, {
    exclude: ['health', 'health/ready', 'health/live'],
  });

  // Configurar Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('🔐 LicitApp API - Authentication & Users')
    .setDescription(
      `
      API de Autenticación y Gestión de Usuarios para LicitApp
      
      **Features:**
      - ✅ Login/Logout con JWT
      - ✅ 2-Step Signup (email + password)
      - ✅ Google OAuth
      - ✅ Refresh Token Rotation
      - ✅ Brute Force Protection (Redis)
      - ✅ Rate Limiting (Redis)
      - ✅ Password Reset/Change
      - ✅ User Management
      
      **Seguridad:**
      - 🛡️ JWT con renovación automática
      - 🚫 Bloqueo de IP tras 5 intentos fallidos
      - ⏱️ Rate Limiting: 5 req/15min (auth), 100 req/min (otros)
      - 🔒 CORS habilitado
      - ✓ Validación de datos
      `,
    )
    .setVersion('1.0.0')
    .setContact(
      'LicitApp Support',
      'https://licitapp.com',
      'support@licitapp.com',
    )
    .setLicense(
      'UNLICENSED',
      'https://licitapp.com/license',
    )
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://api.licitapp.com/api/v1', 'Production')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Access Token (1 hora de validez)',
      },
      'access_token',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Refresh Token (7 días de validez)',
      },
      'refresh_token',
    )
    .addTag('Authentication', 'Endpoints de autenticación (login, signup, OAuth)')
    .addTag('Users', 'Gestión de usuarios (CRUD, perfil)')
    .addTag('Health', 'Health checks')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      tryItOutEnabled: true,
    },
  });

  await app.listen(config.port);
  console.log(`🚀 Application is running on: http://localhost:${config.port}`);
  console.log(
    `📚 Swagger docs available at: http://localhost:${config.port}/docs`
  );
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err.message);
  process.exit(1);
});