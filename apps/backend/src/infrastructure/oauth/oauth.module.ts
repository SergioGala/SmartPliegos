import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { GoogleOAuthProvider } from './providers/google-oauth.provider';
import { GoogleStrategy } from '../../modules/auth/strategies/google.strategy';
import { OAUTH_GOOGLE_PROVIDER } from './oauth.tokens';

/**
 * Encapsula los providers OAuth. AuthModule importa este módulo
 * y consume IOAuthProvider sin saber de Passport ni de Google.
 */
@Module({
  imports: [PassportModule, ConfigModule],
  providers: [
    GoogleStrategy,
    GoogleOAuthProvider,
    { provide: OAUTH_GOOGLE_PROVIDER, useExisting: GoogleOAuthProvider },
  ],
  exports: [GoogleStrategy, OAUTH_GOOGLE_PROVIDER],
})
export class OAuthModule {}