import { createUserSchema } from "./create-user.dto";

describe('createUserSchema', () => {
    it('accepts a valid create user payload', () => {
        const result = createUserSchema.safeParse({
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            timezone: 'America/New_York',
            password: 'longenoughpw',
            role: 'PUBLIC_USER',
            userPlan: 'FREE',
            organizationId: '123e4567-e89b-12d3-a456-426614174000'
        })
        expect(result.success).toBe(true);
    })

    it('normalizes email to lowercase', () => {
        const result = createUserSchema.parse({
            email: 'USER@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            timezone: 'America/New_York',
            password: 'longenoughpw',
            role: 'PUBLIC_USER',
            userPlan: 'FREE',
            organizationId: '123e4567-e89b-12d3-a456-426614174000'
        })
        expect(result.email).toBe('user@example.com');
    })

    it('rejects invalid email format', () => {
        const result = createUserSchema.safeParse({
            email: 'not-an-email',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            timezone: 'America/New_York',
            password: 'longenoughpw',
            role: 'PUBLIC_USER',
            userPlan: 'FREE',
            organizationId: '123e4567-e89b-12d3-a456-426614174000'
        })
        expect(result.success).toBe(false);
    })

    it('rejects missing firstName', () => {
        const result = createUserSchema.safeParse({
            email: 'user@example.com',
            firstName: '',
            lastName: 'Doe',
            phone: '+1234567890',
            timezone: 'America/New_York',
            password: 'longenoughpw',
            role: 'PUBLIC_USER',
            userPlan: 'FREE',
            organizationId: '123e4567-e89b-12d3-a456-426614174000'
        })
        expect(result.success).toBe(false);
    })

    it('rejects missing lastName', () => {
        const result = createUserSchema.safeParse({
            email: 'user@example.com',
            firstName: 'John',
            lastName: '',
            phone: '+1234567890',
            timezone: 'America/New_York',
            password: 'longenoughpw',
            role: 'PUBLIC_USER',
            userPlan: 'FREE',
            organizationId: '123e4567-e89b-12d3-a456-426614174000'
        })
        expect(result.success).toBe(false);
    })

    it('rejects invalid phone format', () => {
        const result = createUserSchema.safeParse({
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: 'invalid-phone',
            timezone: 'America/New_York',
            password: 'longenoughpw',
            role: 'PUBLIC_USER',
            userPlan: 'FREE',
            organizationId: '123e4567-e89b-12d3-a456-426614174000'
        })
        expect(result.success).toBe(false);
    })

    it('rejects invalid timezone', () => {
        const result = createUserSchema.safeParse({
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            timezone: 'invalid-timezone',
            password: 'longenoughpw',
            role: 'PUBLIC_USER',
            userPlan: 'FREE',
            organizationId: '123e4567-e89b-12d3-a456-426614174000'
        })
        expect(result.success).toBe(false);
    })

    it('rejects short password', () => {
        const result = createUserSchema.safeParse({
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            timezone: 'America/New_York',
            password: 'short',
            role: 'PUBLIC_USER',
            userPlan: 'FREE',
            organizationId: '123e4567-e89b-12d3-a456-426614174000'
        })
        expect(result.success).toBe(false);
    })
});