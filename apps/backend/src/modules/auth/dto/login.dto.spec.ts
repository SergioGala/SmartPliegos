import { loginSchema } from './login.dto';

describe('loginSchema', () => {
    it('accepts a valid login', () => {
        const result = loginSchema.safeParse({
            email: 'user@example.com',
            password: 'longenoughpw',
        });
        expect(result.success).toBe(true);
    });

    it('normalizes email to lowercase', () => {
        const result = loginSchema.parse({
            email: 'USER@example.com',
            password: 'longenoughpw',
        });
        expect(result.email).toBe('user@example.com');
    });

    it('rejects short password', () => {
        const result = loginSchema.safeParse({
            email: 'a@b.dev',
            password: 'short',
        });
        expect(result.success).toBe(false);
    });

    it('rejects malformed email', () => {
        const result = loginSchema.safeParse({
            email: 'not-an-email',
            password: 'longenoughpw',
        });
        expect(result.success).toBe(false);
    });
});