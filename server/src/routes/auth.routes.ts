import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  refresh,
  getMe,
  changePassword,
} from '@/controllers/auth.controller.js';
import { requireAuth } from '@/middleware/auth.js';
import { validate } from '@/middleware/validate.js';
import { registerSchema, loginSchema, changePasswordSchema } from '@store-rating/shared';

// ─── Rate limiters ────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Too many registration attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const changePasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: 'Too many password change attempts. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  message: { message: 'Too many token refresh attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const authRouter = Router();

/** POST /api/v1/auth/register */
authRouter.post('/register', registerLimiter, validate(registerSchema), register);

/** POST /api/v1/auth/login */
authRouter.post('/login', loginLimiter, validate(loginSchema), login);

/** POST /api/v1/auth/logout  (token optional – clears cookie regardless) */
authRouter.post('/logout', logout);

/** POST /api/v1/auth/refresh */
authRouter.post('/refresh', refreshLimiter, refresh);

/** GET /api/v1/auth/me  (requires valid access token) */
authRouter.get('/me', requireAuth, getMe);

/** PATCH /api/v1/auth/password */
authRouter.patch(
  '/password',
  requireAuth,
  changePasswordLimiter,
  validate(changePasswordSchema),
  changePassword,
);
