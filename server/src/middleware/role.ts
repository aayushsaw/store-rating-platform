import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@store-rating/shared';
import { HttpError } from '@/lib/errors.js';

/**
 * RBAC middleware factory.  Must be used **after** `requireAuth`.
 *
 * Example:
 *   router.get('/admin/users', requireAuth, requireRoles('SYSTEM_ADMIN'), handler)
 */
export function requireRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(HttpError.unauthorized());
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      next(HttpError.forbidden('You do not have permission to access this resource'));
      return;
    }

    next();
  };
}
