import {
  Injectable,
  BadRequestException,
  Logger,
  UnauthorizedException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignupDto } from './dto/signup.dto';
import { Plan } from '../users/enums';
import { BruteForceService } from '../../common/services/brute-force.service';
import { REDIS_CLIENT } from '../../infrastructure/redis';
import type { RedisClientType } from 'redis';
import type { UserEntity } from '../users/entities';
import type {
  JwtTokenPayload,
  AuthTokensResponse,
  AuthUserResponse,
} from './auth.types';
import * as crypto from 'crypto';
import {
  OAUTH_GOOGLE_PROVIDER,
  type IOAuthProvider,
} from '../../infrastructure/oauth';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60;
  private readonly ACCESS_TOKEN_EXPIRY = 60 * 60;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly bruteForceService: BruteForceService,
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
    @Inject(OAUTH_GOOGLE_PROVIDER) private readonly googleOAuth: IOAuthProvider,
  ) {}

  async login(
    loginDto: LoginDto,
    clientIp: string = 'unknown',
  ): Promise<AuthUserResponse> {
    try {
      const { email, password } = loginDto;
      const sanitizedEmail = email.toLowerCase().trim();

      const user = await this.usersService.findByEmailWithPassword(sanitizedEmail);

      if (!user) {
        await this.bruteForceService.recordFailedAttempt(clientIp);
        throw new UnauthorizedException('Email o contraseña incorrectos');
      }

      if (!user.isActive) {
        await this.bruteForceService.recordFailedAttempt(clientIp);
        throw new UnauthorizedException('La cuenta ha sido desactivada');
      }

      const isPasswordValid = await this.usersService.validatePassword(
        password,
        user.password,
      );

      if (!isPasswordValid) {
        await this.bruteForceService.recordFailedAttempt(clientIp);
        this.logger.warn(
          `Intento de login fallido para: ${sanitizedEmail} desde IP: ${clientIp}`,
        );
        throw new UnauthorizedException('Email o contraseña incorrectos');
      }

      await this.bruteForceService.resetAttempts(clientIp);
      this.logger.log(`Login exitoso para: ${user.email} desde IP: ${clientIp}`);

      return this.generateTokensResponse(user);
    } catch (error) {
      this.logger.error(`Error en login: ${(error as Error).message}`);
      throw error;
    }
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthTokensResponse> {
    try {
      const { refresh_token } = refreshTokenDto;

      if (await this.isRefreshTokenBlacklisted(refresh_token)) {
        throw new UnauthorizedException('Refresh token ha sido invalidado');
      }

      // jwtService.verify() devuelve `any` — cast seguro vía unknown
      let payload: JwtTokenPayload;
      try {
        payload = this.jwtService.verify(refresh_token) as unknown as JwtTokenPayload;
        if (payload.type !== 'refresh') {
  throw new UnauthorizedException('Token inválido: se esperaba un refresh token');
}
      } catch {
        throw new UnauthorizedException('Refresh token inválido o expirado');
      }

      const newPayload: JwtTokenPayload = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        isActive: payload.isActive,
        organizationId: payload.organizationId,
      };

      const access_token = this.jwtService.sign(
  { ...newPayload, type: 'access' },
  { expiresIn: `${this.ACCESS_TOKEN_EXPIRY}s` },
);

      const new_refresh_token = this.jwtService.sign(
  { ...newPayload, type: 'refresh' },
  { expiresIn: `${this.REFRESH_TOKEN_EXPIRY}s` },
);
      this.logger.log(`Token refrescado para usuario: ${payload.email}`);

      return { access_token, refresh_token: new_refresh_token };
    } catch (error) {
      this.logger.error(`Error al refrescar token: ${(error as Error).message}`);
      throw error;
    }
  }

  async logout(refresh_token: string): Promise<{ message: string }> {
    try {
      const tokenHash = this.hashToken(refresh_token);
      const key = `refresh:blacklist:${tokenHash}`;
      await this.redisClient.set(key, '1', { EX: this.REFRESH_TOKEN_EXPIRY });
      this.logger.log('Usuario deslogueado exitosamente');
      return { message: 'Sesión cerrada exitosamente' };
    } catch (error) {
      this.logger.error(`Error al hacer logout: ${(error as Error).message}`);
      throw error;
    }
  }

  async getCurrentUser(userId: string): Promise<Partial<UserEntity>> {
    try {
      const user = await this.usersService.findOne(userId);

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('La cuenta ha sido desactivada');
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Error al obtener usuario actual: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async signup(
    signupDto: SignupDto,
    clientIp: string = 'unknown',
  ): Promise<{ message: string }> {
    try {
      const { email, firstName, lastName, phone, timezone } = signupDto;

      const newUser = await this.usersService.createIncompleteUser({
        email,
        firstName,
        lastName,
        phone,
        timezone,
      });

      try {
        await this.usersService.sendSignupVerificationEmail(newUser);
      } catch (emailError) {
        this.logger.error(
          `FALLO AL ENVIAR EMAIL a ${newUser.email}: ${(emailError as Error).message}`,
          (emailError as Error).stack,
        );
      }

      return {
        message: `Se ha enviado un email a ${email} con las instrucciones para completar tu registro. El enlace es válido por 24 horas.`,
      };
    } catch (error) {
      await this.bruteForceService.recordFailedAttempt(clientIp);
      this.logger.error(
        `Error en signup desde IP ${clientIp}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async completeSignup(
    token: string,
    completeSignupDto: { password: string; passwordConfirm: string },
    clientIp: string = 'unknown',
  ): Promise<AuthUserResponse> {
    try {
      const { password, passwordConfirm } = completeSignupDto;

      const user = await this.usersService.completeSignupWithPassword(
        token,
        password,
        passwordConfirm,
      );

      await this.bruteForceService.resetAttempts(clientIp);
      this.logger.log(`Signup completado: ${user.email} desde IP: ${clientIp}`);

      return this.generateTokensResponse(user);
    } catch (error) {
      await this.bruteForceService.recordFailedAttempt(clientIp);
      this.logger.error(
        `Error al completar signup desde IP ${clientIp}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Inicia sesión o registra un usuario mediante Google OAuth.
   *
   * Recibe el perfil CRUDO devuelto por Passport (`req.user` tal cual lo
   * pasa `GoogleStrategy.validate()`) y delega la normalización al provider
   * OAuth inyectado. De este modo el service no conoce la forma concreta
   * del perfil de Google y depende solo de `IOAuthProvider`.
   */
  async loginWithGoogle(rawGoogleProfile: unknown): Promise<AuthUserResponse> {
    try {
      const profile = this.googleOAuth.normalizeProfile(rawGoogleProfile);
      const sanitizedEmail = profile.email.toLowerCase().trim();

      // 1) ¿Ya existe un usuario vinculado a este google_id?
      const user = await this.usersService.findByGoogleId(profile.externalId);

      if (user) {
        this.logger.log(`Login Google exitoso para: ${user.email}`);
        return this.generateTokensResponse(user);
      }

      // 2) ¿Existe un usuario con ese email pero sin Google vinculado?
      const existingUserByEmail =
        await this.usersService.findByEmail(sanitizedEmail);

      if (existingUserByEmail && !existingUserByEmail.google_id) {
        throw new BadRequestException(
          'Esta cuenta ya existe. Por favor, inicia sesión con tu email y contraseña.',
        );
      }

      // 3) Crear nuevo usuario con datos provenientes de Google.
      const newUser = await this.usersService.createUserWithGoogle({
        google_id: profile.externalId,
        email: sanitizedEmail,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: undefined,
        userPlan: Plan.FREE,
      });

      this.logger.log(`Nuevo usuario creado vía Google: ${newUser.email}`);
      return this.generateTokensResponse(newUser);
    } catch (error) {
      this.logger.error(`Error en Google OAuth: ${(error as Error).message}`);
      throw error;
    }
  }

  private generateTokensResponse(user: UserEntity): AuthUserResponse {
    const payload: JwtTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      organizationId: user.organizationId ?? null,
    };

    const access_token = this.jwtService.sign(
  { ...payload, type: 'access' },
  { expiresIn: `${this.ACCESS_TOKEN_EXPIRY}s` },
);

    const refresh_token = this.jwtService.sign(
  { ...payload, type: 'refresh' },
  { expiresIn: `${this.REFRESH_TOKEN_EXPIRY}s` },
);

    const { password: _pwd, ...userWithoutPassword } = user;

    return { access_token, refresh_token, user: userWithoutPassword };
  }

  private async isRefreshTokenBlacklisted(token: string): Promise<boolean> {
    const key = `refresh:blacklist:${this.hashToken(token)}`;
    const value = await this.redisClient.get(key);
    return value !== null;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}