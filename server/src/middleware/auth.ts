import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '@/lib/errors.js';
import { verifyAccessToken, type AccessTokenPayload } from '@/lib/jwt.js';

// Extend Express Request using interface merging (module augmentation)
declare module 'express-serve-static-core' {
  interface Request {
    user?: AccessTokenPayload;
  }
}

/**
 * Protect a route by verifying the JWT access token present in the
 * `Authorization: Bearer <token>` header.
 *
 * On success, attaches the decoded payload to `req.user`.
 * On failure, forwards a 401 HttpError to the error handler.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(HttpError.unauthorized('Access token is missing'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(HttpError.unauthorized('Access token is invalid or expired'));
  }
}
