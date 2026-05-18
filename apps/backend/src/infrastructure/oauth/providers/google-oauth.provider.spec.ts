import { GoogleOAuthProvider } from './google-oauth.provider';

describe('GoogleOAuthProvider', () => {
  let provider: GoogleOAuthProvider;

  beforeEach(() => {
    provider = new GoogleOAuthProvider();
  });

  it('normalizes a full Google profile', () => {
    const raw = {
      id: 'g-123',
      name: { givenName: 'Ana', familyName: 'García' },
      emails: [{ value: 'ana@gmail.com', verified: true }],
      photos: [{ value: 'https://lh3.gstatic.com/ana.jpg' }],
    };

    const result = provider.normalizeProfile(raw);

    expect(result).toEqual({
      externalId: 'g-123',
      provider: 'google',
      email: 'ana@gmail.com',
      emailVerified: true,
      firstName: 'Ana',
      lastName: 'García',
      pictureUrl: 'https://lh3.gstatic.com/ana.jpg',
    });
  });

  it('defaults emailVerified to false when missing', () => {
    const result = provider.normalizeProfile({
      id: 'g-1',
      emails: [{ value: 'u@gmail.com' }],
    });
    expect(result.emailVerified).toBe(false);
  });

  it('returns null pictureUrl when no photos', () => {
    const result = provider.normalizeProfile({
      id: 'g-1',
      emails: [{ value: 'u@gmail.com' }],
    });
    expect(result.pictureUrl).toBeNull();
  });

  it('throws when no email is present', () => {
    expect(() =>
      provider.normalizeProfile({ id: 'g-1', emails: [] }),
    ).toThrow(/no email/);
  });

  it('throws on invalid profile shape', () => {
    expect(() => provider.normalizeProfile(null)).toThrow(/invalid profile shape/);
    expect(() => provider.normalizeProfile('hi')).toThrow(/invalid profile shape/);
  });
});