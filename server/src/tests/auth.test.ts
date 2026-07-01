/**
 * Integration tests for the /api/v1/auth endpoints.
 *
 * Prerequisites:
 *   - A running PostgreSQL instance (DATABASE_URL in server/.env)
 *   - Prisma migrations applied
 *
 * Run with: npm run test -w server
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validUser = {
  name: 'Alexander Montgomery Smith',
  email: 'alex.smith.test@example.com',
  address: '123 Main Street, Springfield, IL 62701',
  password: 'Secure@123',
};

async function cleanupUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

async function registerAndLogin(overrides?: Partial<typeof validUser>) {
  const payload = { ...validUser, ...overrides };
  await request(app).post('/api/v1/auth/register').send(payload);
  const res = await request(app).post('/api/v1/auth/login').send({
    email: payload.email,
    password: payload.password,
  });
  return res;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupUser(validUser.email);
  });

  // ── Register ──────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    it('creates a new NORMAL_USER and returns 201', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.user).toMatchObject({
        name: validUser.name,
        email: validUser.email,
        role: 'NORMAL_USER',
      });
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('returns 409 when email is already registered', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const res = await request(app).post('/api/v1/auth/register').send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('returns 400 when name is too short (< 8 chars)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, name: 'John' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty('name');
    });

    it('returns 400 when password has no uppercase letter', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'other@example.com', password: 'secure@123' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty('password');
    });

    it('returns 400 when password has no special character', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'other@example.com', password: 'SecurePass1' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty('password');
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty('email');
    });
  });

  // ── Login ─────────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('returns access token and sets refresh cookie on valid credentials', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toMatchObject({ email: validUser.email, role: 'NORMAL_USER' });

      const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
      expect(cookies).toBeDefined();
      const refreshCookie = cookies?.find((c) => c.startsWith('refresh_token='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toMatch(/HttpOnly/i);
    });

    it('returns 401 on wrong password', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'WrongPass@1' });

      expect(res.status).toBe(401);
    });

    it('returns 401 on unknown email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'Secure@123' });

      expect(res.status).toBe(401);
    });
  });

  // ── Refresh ───────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('issues new access token and rotates refresh cookie', async () => {
      const loginRes = await registerAndLogin();
      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((c) => c.startsWith('refresh_token=')) ?? '';
      const cookieValue = refreshCookie.split(';')[0]; // "refresh_token=<value>"

      const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookieValue);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');

      // New cookie should be different (rotation)
      const newCookies = res.headers['set-cookie'] as unknown as string[];
      const newRefreshCookie = newCookies?.find((c) => c.startsWith('refresh_token=')) ?? '';
      expect(newRefreshCookie).not.toBe(refreshCookie);
    });

    it('returns 401 when no refresh cookie is provided', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('detects refresh token reuse and invalidates all sessions', async () => {
      const loginRes = await registerAndLogin();
      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((c) => c.startsWith('refresh_token=')) ?? '';
      const cookieValue = refreshCookie.split(';')[0];

      // Use the token once — this rotates it
      await request(app).post('/api/v1/auth/refresh').set('Cookie', cookieValue);

      // Attempt to reuse the now-revoked token
      const reuseRes = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookieValue);

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.message).toMatch(/invalidated/i);
    });
  });

  // ── Me ────────────────────────────────────────────────────────────────────

  describe('GET /api/v1/auth/me', () => {
    it('returns the current user profile when authenticated', async () => {
      const loginRes = await registerAndLogin();
      const { accessToken } = loginRes.body as { accessToken: string };

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        email: validUser.email,
        name: validUser.name,
        role: 'NORMAL_USER',
      });
      expect(res.body).toHaveProperty('address');
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });
  });

  // ── Logout ────────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('clears the refresh cookie and revokes the token in DB', async () => {
      const loginRes = await registerAndLogin();
      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((c) => c.startsWith('refresh_token=')) ?? '';
      const cookieValue = refreshCookie.split(';')[0];

      const logoutRes = await request(app).post('/api/v1/auth/logout').set('Cookie', cookieValue);

      expect(logoutRes.status).toBe(200);

      // After logout, refresh should fail
      const refreshRes = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookieValue);

      expect(refreshRes.status).toBe(401);
    });

    it('returns 200 even when no cookie is provided (idempotent)', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(200);
    });
  });

  // ── Change Password ───────────────────────────────────────────────────────

  describe('PATCH /api/v1/auth/password', () => {
    it('changes password and invalidates all sessions', async () => {
      const loginRes = await registerAndLogin();
      const { accessToken } = loginRes.body as { accessToken: string };
      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((c) => c.startsWith('refresh_token=')) ?? '';
      const cookieValue = refreshCookie.split(';')[0];

      const changeRes = await request(app)
        .patch('/api/v1/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: validUser.password, newPassword: 'NewPass@456' });

      expect(changeRes.status).toBe(200);

      // Old refresh token should no longer work
      const refreshRes = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookieValue);
      expect(refreshRes.status).toBe(401);

      // Should now be able to log in with new password
      const newLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'NewPass@456' });
      expect(newLoginRes.status).toBe(200);

      // Cleanup: restore original password
      const newAccessToken = newLoginRes.body.accessToken as string;
      await request(app)
        .patch('/api/v1/auth/password')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({ currentPassword: 'NewPass@456', newPassword: validUser.password });
    });

    it('returns 400 when current password is incorrect', async () => {
      const loginRes = await registerAndLogin();
      const { accessToken } = loginRes.body as { accessToken: string };

      const res = await request(app)
        .patch('/api/v1/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'WrongPass@1', newPassword: 'NewPass@456' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when new password is same as current', async () => {
      const loginRes = await registerAndLogin();
      const { accessToken } = loginRes.body as { accessToken: string };

      const res = await request(app)
        .patch('/api/v1/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: validUser.password, newPassword: validUser.password });

      expect(res.status).toBe(400);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/password')
        .send({ currentPassword: 'Secure@123', newPassword: 'NewPass@456' });

      expect(res.status).toBe(401);
    });
  });
});
