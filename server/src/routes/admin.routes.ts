import { Router } from 'express';
import { requireAuth } from '@/middleware/auth.js';
import { requireRoles } from '@/middleware/role.js';
import { validate } from '@/middleware/validate.js';
import {
  UserRole,
  userQuerySchema,
  adminCreateUserSchema,
  storeQuerySchema,
  createStoreWithOwnerSchema,
} from '@store-rating/shared';
import {
  getDashboardStats,
  listUsers,
  getUserDetail,
  createUser,
  softDeleteUser,
  reactivateUser,
  listStores,
  createStoreWithOwner,
} from '@/controllers/admin.controller.js';

export const adminRouter = Router();

// Apply auth and admin checks on all routes in this router
adminRouter.use(requireAuth);
adminRouter.use(requireRoles(UserRole.SYSTEM_ADMIN));

/**
 * GET /api/v1/admin/dashboard
 */
adminRouter.get('/dashboard', getDashboardStats);

/**
 * GET /api/v1/admin/users
 */
adminRouter.get('/users', validate(userQuerySchema, 'query'), listUsers);

/**
 * GET /api/v1/admin/users/:id
 */
adminRouter.get('/users/:id', getUserDetail);

/**
 * POST /api/v1/admin/users
 */
adminRouter.post('/users', validate(adminCreateUserSchema, 'body'), createUser);

/**
 * DELETE /api/v1/admin/users/:id
 */
adminRouter.delete('/users/:id', softDeleteUser);

/**
 * PATCH /api/v1/admin/users/:id/reactivate
 */
adminRouter.patch('/users/:id/reactivate', reactivateUser);

/**
 * GET /api/v1/admin/stores
 */
adminRouter.get('/stores', validate(storeQuerySchema, 'query'), listStores);

/**
 * POST /api/v1/admin/stores
 */
adminRouter.post('/stores', validate(createStoreWithOwnerSchema, 'body'), createStoreWithOwner);
