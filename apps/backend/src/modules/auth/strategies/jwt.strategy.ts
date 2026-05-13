import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtTokenPayload } from '../auth.types';

/**
 * JWT Strategy para validar tokens
 * Extrae el token del header Authorization y lo valida
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Valida el payload del JWT
   * @param payload - Payload decodificado del JWT
   * @returns Datos del usuario
   */
  validate(payload: JwtTokenPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      isActive: payload.isActive,
      organizationId: payload.organizationId,
    };
  }
}
