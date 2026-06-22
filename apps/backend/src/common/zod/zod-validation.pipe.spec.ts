import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
    const schema = z.object({
        email: z.string().email(),
        age: z.number().int().min(18),
        nickname: z.string().optional(),
    });

    type Input = z.infer<typeof schema>;
    const pipe = new ZodValidationPipe<typeof schema>(schema);

    it('returns parsed data when valid', () => {
        const result = pipe.transform(
            { email: 'a@b.dev', age: 21 },
            { type: 'body', metatype: undefined as never, data: undefined },
        );
        expect(result).toEqual<Input>({ email: 'a@b.dev', age: 21 });
    });

    it('throws BadRequestException with structured issues when invalid', () => {
        expect.assertions(3);
        try {
            pipe.transform({ email: 'not-email', age: 5 }, {
                type: 'body',
                metatype: undefined as never,
                data: undefined,
            });
        } catch (e) {
            expect(e).toBeInstanceOf(BadRequestException);
            const response = (e as BadRequestException).getResponse() as {
                issues: Array<{ path: string; code: string; message: string }>;
            };
            expect(response.issues.map((i) => i.path).sort()).toEqual(['age', 'email']);
            expect(response.issues.every((i) => typeof i.message === 'string')).toBe(true);
        }
    });

    it('strips unknown keys with .strict() schema', () => {
        const strict = z.object({ a: z.string() }).strict();
        const strictPipe = new ZodValidationPipe(strict);
        expect(() =>
            strictPipe.transform({ a: 'x', extra: 'y' }, {
                type: 'body',
                metatype: undefined as never,
                data: undefined,
            }),
        ).toThrow(BadRequestException);
    });
});