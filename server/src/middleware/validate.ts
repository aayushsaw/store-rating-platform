import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { HttpError } from '@/lib/errors.js';

type Target = 'body' | 'query' | 'params';

/**
 * Express middleware factory that validates a request segment against a Zod
 * schema. On failure it passes a 400 `HttpError` with field-level messages to
 * the next error handler.
 */
export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || 'root';
        errors[key] = [...(errors[key] ?? []), issue.message];
      }
      next(HttpError.badRequest('Validation failed', errors));
      return;
    }
    // Replace with parsed / coerced value
    req[target] = result.data as (typeof req)[typeof target];
    next();
  };
}
