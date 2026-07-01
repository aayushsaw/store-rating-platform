import { Router } from 'express';
import { requireAuth } from '@/middleware/auth.js';
import { requireRoles } from '@/middleware/role.js';
import { UserRole } from '@store-rating/shared';
import { getOwnerDashboard } from '@/controllers/owner.controller.js';

export const ownerRouter = Router();

// Enforce auth and restrict strictly to store owners
ownerRouter.use(requireAuth);
ownerRouter.use(requireRoles(UserRole.STORE_OWNER));

/** GET /api/v1/owner/dashboard - Stats and user reviews aggregate feed */
ownerRouter.get('/dashboard', getOwnerDashboard);
