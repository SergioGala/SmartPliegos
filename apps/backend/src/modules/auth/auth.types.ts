import type { Role } from '../users/enums';

export type TokenType = 'access' | 'refresh';
export interface JwtTokenPayload {
  sub: string;
  email: string;
  role: Role;
  isActive: boolean;
  organizationId: string | null;
  type?: TokenType;
}

export interface AuthTokensResponse {
  access_token: string;
  refresh_token: string;
}

export interface AuthUserResponse extends AuthTokensResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    isActive: boolean;
    organizationId: string | null;
    userPlan?: string;
    google_id?: string;
  };
}