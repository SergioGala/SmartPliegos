/**
 * Perfil OAuth normalizado, independiente del provider concreto.
 *
 * Cualquier IOAuthProvider devuelve este formato. AuthService nunca
 * habla de "GoogleProfile" o "GitHubProfile": solo de NormalizedOAuthProfile.
 */
export interface NormalizedOAuthProfile {
  /** ID del usuario en el provider remoto (ej. google_id). */
  externalId: string;
  /** Provider: 'google', 'github', etc. */
  provider: 'google';
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  pictureUrl: string | null;
}

/**
 * Interfaz que cualquier provider OAuth implementa.
 *
 * Pensada para que AuthService pueda añadir GitHub/LinkedIn/etc.
 * sin tocar nada interno: solo inyectar otra implementación.
 */
export interface IOAuthProvider {
  readonly providerName: NormalizedOAuthProfile['provider'];

  /**
   * Toma el resultado bruto del callback (lo que Passport pasa en el
   * profile) y lo convierte al formato normalizado.
   */
  normalizeProfile(rawProfile: unknown): NormalizedOAuthProfile;
}