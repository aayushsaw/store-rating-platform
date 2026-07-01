import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '@/lib/errors.js';
import { logger } from '@/lib/logger.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // Express requires 4 parameters to recognise error-handling middleware.
  _next: NextFunction,
): void {
  // ── HttpError (thrown by controllers / middleware) ────────────────────────
  if (err instanceof HttpError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, err.message);
    }
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  // ── ZodError (should already be caught by validate middleware, but safety net)
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || 'root';
      errors[key] = [...(errors[key] ?? []), issue.message];
    }
    res.status(400).json({ message: 'Validation failed', errors });
    return;
  }

  // ── Unknown errors ────────────────────────────────────────────────────────
  logger.error({ err }, 'Unhandled error');
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : String(err);
  res.status(500).json({ message });
}
