import { Router } from 'express';
import { requireAuth } from '@/middleware/auth.js';
import { requireRoles } from '@/middleware/role.js';
import { validate } from '@/middleware/validate.js';
import { storeQuerySchema, submitRatingSchema, UserRole } from '@store-rating/shared';
import { listStores, getStoreDetail, submitRating } from '@/controllers/store.controller.js';

export const storeRouter = Router();

// Enforce authentication for all store routes
storeRouter.use(requireAuth);

/** GET /api/v1/stores - List stores with search, pagination, and overall ratings */
storeRouter.get('/', validate(storeQuerySchema, 'query'), listStores);

/** GET /api/v1/stores/:id - View details and reviews list of a specific store */
storeRouter.get('/:id', getStoreDetail);

/** POST /api/v1/stores/:id/rating - Submit or edit a store rating (Only Customers) */
storeRouter.post(
  '/:id/rating',
  requireRoles(UserRole.NORMAL_USER),
  validate(submitRatingSchema, 'body'),
  submitRating,
);
