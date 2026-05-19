import { Injectable } from '@nestjs/common';
import type {
  IOAuthProvider,
  NormalizedOAuthProfile,
} from '../oauth.types';

interface RawGoogleProfile {
  id: string;
  name?: { givenName?: string; familyName?: string };
  emails?: Array<{ value: string; verified?: boolean }>;
  photos?: Array<{ value: string }>;
}

@Injectable()
export class GoogleOAuthProvider implements IOAuthProvider {
  public readonly providerName = 'google' as const;

  normalizeProfile(rawProfile: unknown): NormalizedOAuthProfile {
    if (!this.isGoogleProfile(rawProfile)) {
      throw new Error('GoogleOAuthProvider.normalizeProfile: invalid profile shape');
    }

    const primaryEmail = rawProfile.emails?.[0];
    if (!primaryEmail?.value) {
      throw new Error('GoogleOAuthProvider.normalizeProfile: profile has no email');
    }

    return {
      externalId: rawProfile.id,
      provider: 'google',
      email: primaryEmail.value,
      emailVerified: primaryEmail.verified ?? false,
      firstName: rawProfile.name?.givenName ?? '',
      lastName: rawProfile.name?.familyName ?? '',
      pictureUrl: rawProfile.photos?.[0]?.value ?? null,
    };
  }

  private isGoogleProfile(p: unknown): p is RawGoogleProfile {
    return typeof p === 'object' && p !== null && 'id' in p;
  }
}