import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import type { ZodTypeAny, infer as ZodInfer } from 'zod';

@Injectable()
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown, _metadata: ArgumentMetadata): ZodInfer<T> {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join('.') || '(root)',
        code: issue.code,
        message: issue.message,
      }));

      throw new BadRequestException({
        statusCode: 400,
        error: 'Validation Error',
        message: 'Request validation failed',
        issues,
      });
    }

    return result.data;
  }
}