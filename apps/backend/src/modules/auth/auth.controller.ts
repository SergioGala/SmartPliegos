
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiExtraModels,
  ApiHeader,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { ZodBody } from '../../common/zod';
import { loginSchema, type LoginDto, LoginDtoSwagger } from './dto/login.dto';
import { signupSchema, type SignupDto, SignupDtoSwagger } from './dto/signup.dto';
import { completeSignupSchema, type CompleteSignupDto, CompleteSignupDtoSwagger } from './dto/complete-signup.dto';
import { refreshTokenSchema, type RefreshTokenDto, RefreshTokenDtoSwagger } from './dto/refresh-token.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { BruteForceCooldown, RateLimitStrict, SecureAuthEndpoint } from '../../common/decorators';
import type { AuthUserResponse } from './auth.types';


/**
 * Request tras pasar por JwtAuthGuard.
 * El guard puebla request.user con el payload del JWT.
 */
interface JwtAuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: string;
    isActive?: boolean;
  };
}

/**
 * Request tras pasar por GoogleAuthGuard (Passport OAuth).
 * Passport puebla request.user con el perfil de Google,
 * tal como lo devuelve GoogleStrategy.validate().
 */
interface GoogleAuthenticatedRequest extends ExpressRequest {
  user: {
    google_id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}
@ApiTags('Authentication')
@ApiExtraModels(LoginDtoSwagger, SignupDtoSwagger, CompleteSignupDtoSwagger, RefreshTokenDtoSwagger)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * Login - Autentica usuario con email y contraseña
   * Rate Limit: 5 requests por 15 minutos
   * Brute Force: Bloqueo de IP después de 5 intentos fallidos
   */
  @Post('login')
  @RateLimitStrict()
  @BruteForceCooldown()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login de usuario',
    description: `
      Autentica un usuario existente con email y contraseña.
      
      **Seguridad:**
      - Rate Limit: 5 intentos por 15 minutos
      - Brute Force: IP bloqueada tras 5 fallos
      - Tokens JWT de corta duración (1h access, 7d refresh)
      
      **Respuesta exitosa:**
      - access_token: JWT válido por 1 hora
      - refresh_token: JWT válido por 7 días
      - user: Datos del usuario autenticado
    `,
  })
  @ApiBody({
    type: LoginDtoSwagger,
    examples: {
      example1: {
        value: {
          email: 'user@example.com',
          password: 'SecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PUBLIC_USER',
          isActive: true,
          createdAt: '2026-04-17T02:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o cuenta desactivada',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos de login (Rate Limit)',
  })
  @ApiHeader({
    name: 'X-RateLimit-Limit',
    required: false,
    description: 'Límite de requests permitidos',
  })
  @ApiHeader({
    name: 'X-RateLimit-Remaining',
    required: false,
    description: 'Requests restantes',
  })
  async login(
    @ZodBody(loginSchema) loginDto: LoginDto,
    @Request() request: ExpressRequest,
  ): Promise<AuthUserResponse> {
    const clientIp = this.getClientIp(request);
    return this.authService.login(loginDto, clientIp);
  }

  /**
   * Refresh Token - Genera nuevo access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar access token',
    description: `
      Genera un nuevo access token usando un refresh token válido.
      
      El refresh token se rota automáticamente en cada uso.
      Útil cuando el access token expira (después de 1 hora).
    `,
  })
  @ApiBody({ type: RefreshTokenDtoSwagger })
  @ApiResponse({
    status: 200,
    description: 'Token renovado exitosamente',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
  async refresh(@ZodBody(refreshTokenSchema) refreshTokenDto: RefreshTokenDto): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * Logout - Cierra sesión e invalida tokens
   */
  @Post('logout')
  @SecureAuthEndpoint()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: `
      Invalida el refresh token e cierra la sesión del usuario.
      
      Después del logout, los tokens ya no pueden usarse.
      Es necesario hacer login nuevamente para obtener nuevos tokens.
    `,
  })
  @ApiBody({ type: RefreshTokenDtoSwagger })
  @ApiResponse({
    status: 200,
    description: 'Logout exitoso',
    schema: {
      example: {
        message: 'Sesión cerrada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o expirado',
  })
  async logout(@ZodBody(refreshTokenSchema) body: RefreshTokenDto): Promise<{ message: string }> {
    return this.authService.logout(body.refresh_token);
  }

  /**
   * Me - Obtener datos del usuario autenticado
   */
  @Get('me')
  @SecureAuthEndpoint()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener perfil del usuario',
    description: `
      Obtiene los datos del usuario autenticado actualmente.
      
      Requiere: JWT access token válido en Authorization header
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Datos del usuario',
    schema: {
      example: {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+34912345678',
        role: 'PUBLIC_USER',
        userPlan: 'FREE',
        isActive: true,
        createdAt: '2026-04-17T02:00:00Z',
        updatedAt: '2026-04-17T02:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o expirado',
  })
  async me(@Request() request: JwtAuthenticatedRequest) {
    return this.authService.getCurrentUser(request.user.id);
  }

  /**
   * Signup (Step 1) - Registra nuevo usuario
   * Rate Limit: 5 requests por 15 minutos
   * Brute Force: Bloqueo de IP después de 5 intentos fallidos
   */
  @Post('signup')
  @RateLimitStrict()
  @BruteForceCooldown()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Iniciar registro (Step 1)',
    description: `
      Inicia el proceso de registro de 2 pasos.
      
      1️⃣ **Este endpoint** crea un usuario INACTIVO y envía email de verificación
      2️⃣ El usuario debe completar el registro en POST /complete-signup/:token
      
      **Qué sucede:**
      - Se valida que el email sea único
      - Se crea usuario sin contraseña
      - Se genera token de verificación (24h de validez)
      - Se envía email con link de verificación
      
      **Seguridad:**
      - Rate Limit: 5 signups por 15 minutos por IP
      - Brute Force: IP bloqueada tras 5 fallos
      - Email de verificación requerido
    `,
  })
  @ApiBody({ type: SignupDtoSwagger })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado, email de verificación enviado',
    schema: {
      example: {
        message: 'Se ha enviado un email a user@example.com con las instrucciones para completar tu registro. El enlace es válido por 24 horas.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email ya registrado o datos inválidos',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit excedido',
  })
  async signup(
    @ZodBody(signupSchema) signupDto: SignupDto,
    @Request() request: ExpressRequest,
  ): Promise<{ message: string }> {
    const clientIp = this.getClientIp(request);
    return this.authService.signup(signupDto, clientIp);
  }

  /**
   * Complete Signup (Step 2) - Completa el registro con contraseña
   * Rate Limit: 5 requests por 15 minutos
   * Brute Force: Bloqueo de IP después de 5 intentos fallidos
   */
  @Post('complete-signup/:token')
  @RateLimitStrict()
  @BruteForceCooldown()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Completar registro (Step 2)',
    description: `
      Completa el registro de 2 pasos.
      
      2️⃣ **Este endpoint** valida el token y establece la contraseña
      
      **Qué sucede:**
      - Valida que el token sea válido y no esté expirado (24h)
      - Valida que las contraseñas coincidan
      - Activa la cuenta del usuario
      - Login automático (retorna tokens JWT)
      
      **Seguridad:**
      - Contraseña se hashea con bcrypt
      - Token se elimina tras usar
      - Login automático después de registro
    `,
  })
  @ApiParam({
    name: 'token',
    description: 'Token de verificación enviado por email (válido 24 horas)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  @ApiBody({ type: CompleteSignupDtoSwagger })
  @ApiResponse({
    status: 200,
    description: 'Registro completado y usuario autenticado',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PUBLIC_USER',
          isActive: true,
          createdAt: '2026-04-17T02:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido/expirado o contraseñas no coinciden',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit excedido',
  })
  async completeSignup(
    @Param('token') token: string,
    @ZodBody(completeSignupSchema) completeSignupDto: CompleteSignupDto,
    @Request() request: ExpressRequest,
  ): Promise<AuthUserResponse> {
    const clientIp = this.getClientIp(request);
    return this.authService.completeSignup(token, completeSignupDto, clientIp);
  }

  /**
   * Google OAuth - Inicia el flujo de autenticación con Google
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Iniciar autenticación con Google',
    description: `
      Inicia el flujo OAuth 2.0 con Google.
      
      **Qué sucede:**
      - Redirige a pantalla de login de Google
      - Usuario autoriza la aplicación
      - Google redirige a /auth/google/callback
      - Se crea usuario o se loguea si ya existe
      
      **Nota:** Este endpoint hace redirect, no retorna JSON
    `,
  })
  @ApiResponse({
    status: 302,
    description: 'Redirige a Google OAuth',
  })
  googleAuth(): void {
    // Passport maneja la redirección a Google
  }

  /**
   * Google OAuth Callback - Maneja el callback de Google
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Callback de autenticación con Google',
    description: `
      Procesa el callback de Google OAuth.
      
      **Qué sucede:**
      - Google redirige aquí después de la autorización
      - Valida el perfil de Google
      - Crea usuario si no existe
      - Loguea al usuario
      - Redirige al frontend con tokens en URL
      
      **Nota:** Este endpoint hace redirect, no retorna JSON
    `,
  })
  @ApiResponse({
    status: 302,
    description: 'Redirige al frontend con tokens en URL',
  })
  @ApiResponse({
    status: 400,
    description: 'Email ya registrado sin Google o error de autenticación',
  })
  async googleAuthCallback(
    @Request() req: GoogleAuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const googleProfile = req.user;
      const result = await this.authService.loginWithGoogle(googleProfile);
      const frontendRedirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?access_token=${result.access_token}&refresh_token=${result.refresh_token}`;
      res.redirect(frontendRedirectUrl);
    } catch (error) {
      const frontendErrorUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?message=${encodeURIComponent((error as Error).message)}`;
      res.redirect(frontendErrorUrl);
    }
  }

  private getClientIp(request: ExpressRequest): string {
    const xForwardedFor = request.headers['x-forwarded-for'];

    if (xForwardedFor) {
      if (Array.isArray(xForwardedFor)) {
        // express puede devolver string[] si hay múltiples cabeceras
        return xForwardedFor[0]?.trim() ?? 'unknown';
      }
      // string: puede ser "ip1, ip2, ip3" → cogemos la primera
      return xForwardedFor.split(',')[0]?.trim() ?? 'unknown';
    }

    return request.ip ?? request.socket.remoteAddress ?? 'unknown';
  }
}
