import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env.js';
import type { UserRole } from '@store-rating/shared';

// ─── Access Token ─────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret, {
    algorithms: ['HS256'],
  }) as AccessTokenPayload;
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically-secure opaque refresh token.
 * Returns the raw token (sent to client) and its SHA-256 hash (stored in DB).
 */
export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(64).toString('hex');
  const hash = hashRefreshToken(raw);
  return { raw, hash };
}

export function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Parse the refresh expiry string (e.g. "7d") to a future Date.
 */
export function refreshTokenExpiryDate(): Date {
  const expiresIn = env.jwtRefreshExpiresIn;
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) {
    throw new Error(`Invalid JWT_REFRESH_EXPIRES_IN format: ${expiresIn}`);
  }
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const ms: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return new Date(Date.now() + amount * ms[unit]);
}

/**
 * Parse the refresh expiry string to milliseconds for the cookie `maxAge`.
 */
export function refreshTokenMaxAgeMs(): number {
  const expiresIn = env.jwtRefreshExpiresIn;
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) {
    throw new Error(`Invalid JWT_REFRESH_EXPIRES_IN format: ${expiresIn}`);
  }
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const ms: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * ms[unit];
}
