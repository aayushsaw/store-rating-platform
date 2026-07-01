import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/lib/prisma.js';
import { HttpError } from '@/lib/errors.js';
import { logger } from '@/lib/logger.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
  refreshTokenMaxAgeMs,
} from '@/lib/jwt.js';
import { env } from '@/config/env.js';
import type { AuthResponse, AuthUser } from '@store-rating/shared';

// ─── Cookie configuration ─────────────────────────────────────────────────────

const REFRESH_COOKIE_NAME = 'refresh_token';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !env.isDevelopment,
    path: '/api/v1/auth/refresh',
    maxAge: refreshTokenMaxAgeMs(),
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !env.isDevelopment,
    path: '/api/v1/auth/refresh',
  });
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toAuthUser(user: { id: string; name: string; email: string; role: string }): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as AuthUser['role'],
  };
}

async function storeRefreshToken(userId: string, hash: string, req: Request): Promise<void> {
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hash,
      expiresAt: refreshTokenExpiryDate(),
      userAgent: req.headers['user-agent']?.slice(0, 500) ?? null,
      ipAddress: getClientIp(req),
      lastUsedAt: new Date(),
    },
  });
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Creates a new NORMAL_USER account.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, address, password } = req.body as {
      name: string;
      email: string;
      address: string;
      password: string;
    };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      next(HttpError.conflict('An account with this email already exists'));
      return;
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

    const user = await prisma.user.create({
      data: { name, email, address, passwordHash, role: 'NORMAL_USER' },
    });

    logger.info({ userId: user.id, email: user.email }, 'User registered');

    res.status(201).json({
      message: 'Account created successfully',
      user: toAuthUser(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      next(HttpError.unauthorized('Invalid email or password'));
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      next(HttpError.unauthorized('Invalid email or password'));
      return;
    }

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as AuthUser['role'],
    });

    const { raw: refreshRaw, hash: refreshHash } = generateRefreshToken();
    await storeRefreshToken(user.id, refreshHash, req);

    setRefreshCookie(res, refreshRaw);

    logger.info({ userId: user.id, email: user.email }, 'User logged in');

    const response: AuthResponse = {
      accessToken,
      user: toAuthUser(user),
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/logout
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;

    if (rawToken) {
      const hash = hashRefreshToken(rawToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    clearRefreshCookie(res);
    logger.info({ userId: req.user?.sub }, 'User logged out');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/refresh
 * Rotate the refresh token and issue a new access token.
 */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;

    if (!rawToken) {
      next(HttpError.unauthorized('Refresh token is missing'));
      return;
    }

    const hash = hashRefreshToken(rawToken);

    const stored = await prisma.refreshToken.findFirst({
      where: { tokenHash: hash },
      include: { user: true },
    });

    if (!stored) {
      next(HttpError.unauthorized('Invalid refresh token'));
      return;
    }

    // Reuse detection: if token was already revoked, revoke ALL sessions for this user
    if (stored.revokedAt) {
      logger.warn(
        { userId: stored.userId },
        'Refresh token reuse detected – revoking all sessions',
      );
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      clearRefreshCookie(res);
      next(HttpError.unauthorized('Session has been invalidated. Please log in again.'));
      return;
    }

    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
      clearRefreshCookie(res);
      next(HttpError.unauthorized('Refresh token has expired'));
      return;
    }

    if (stored.user.deletedAt) {
      next(HttpError.unauthorized('Account has been deactivated'));
      return;
    }

    // Revoke the old token
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    // Issue new tokens
    const accessToken = signAccessToken({
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role as AuthUser['role'],
    });

    const { raw: newRaw, hash: newHash } = generateRefreshToken();
    await storeRefreshToken(stored.user.id, newHash, req);

    setRefreshCookie(res, newRaw);

    logger.debug({ userId: stored.user.id }, 'Tokens rotated');

    const response: AuthResponse = {
      accessToken,
      user: toAuthUser(stored.user),
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /auth/me
 * Returns the currently authenticated user's profile.
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      next(HttpError.notFound('User not found'));
      return;
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /auth/password
 * Change the authenticated user's password.
 */
export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      next(HttpError.notFound('User not found'));
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      next(HttpError.badRequest('Current password is incorrect'));
      return;
    }

    const newHash = await bcrypt.hash(newPassword, env.bcryptRounds);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

    // Invalidate all other refresh tokens (force re-login on other devices)
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    clearRefreshCookie(res);
    logger.info({ userId }, 'Password changed – all sessions invalidated');

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}
