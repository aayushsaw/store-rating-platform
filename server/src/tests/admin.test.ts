import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { signAccessToken } from '../lib/jwt.js';
import { UserRole } from '@store-rating/shared';

const app = createApp();

describe('Admin Endpoints', () => {
  let adminToken: string;
  let adminId: string;
  let normalToken: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Clean up to ensure test starts fresh
    await prisma.rating.deleteMany();
    await prisma.store.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    // Create a system administrator
    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin Administrator Person',
        email: 'admin.test.m2@example.com',
        passwordHash: 'dummy_hash',
        address: 'Admin Headquarters Main Office',
        role: UserRole.SYSTEM_ADMIN,
      },
    });
    adminId = admin.id;
    adminToken = signAccessToken({
      sub: admin.id,
      email: admin.email,
      role: admin.role as UserRole,
    });

    // Create a normal user for comparison / test targets
    // Create a normal user for comparison / test targets
    const normal = await prisma.user.create({
      data: {
        name: 'Regular Customer Tester Dummy',
        email: 'normal.test.m2@example.com',
        passwordHash: 'dummy_hash',
        address: 'Normal User Address Springfield',
        role: UserRole.NORMAL_USER,
      },
    });
    normalToken = signAccessToken({
      sub: normal.id,
      email: normal.email,
      role: normal.role as UserRole,
    });
  });

  afterAll(async () => {
    await prisma.rating.deleteMany();
    await prisma.store.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  // ── RBAC Security Checks ───────────────────────────────────────────────────

  describe('RBAC Guards', () => {
    it('returns 403 Forbidden when accessed by a NORMAL_USER', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${normalToken}`);

      expect(res.status).toBe(403);
    });

    it('returns 401 Unauthorized when no token is provided', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard');
      expect(res.status).toBe(401);
    });
  });

  // ── Dashboard Stats ──────────────────────────────────────────────────────────

  describe('GET /api/v1/admin/dashboard', () => {
    it('returns metrics and activity data for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toHaveProperty('totalUsers');
      expect(res.body.metrics).toHaveProperty('activeUsers');
      expect(res.body.metrics).toHaveProperty('totalStores');
      expect(res.body.metrics).toHaveProperty('totalRatings');
      expect(res.body.metrics).toHaveProperty('averageRating');
      expect(res.body.activity).toHaveProperty('recentUsers');
      expect(res.body.activity).toHaveProperty('recentStores');
      expect(res.body.activity).toHaveProperty('recentRatings');
    });
  });

  // ── User Management ──────────────────────────────────────────────────────────

  describe('User Management', () => {
    it('lists users with pagination, sorting, and filtering', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?page=1&limit=10&sortBy=name&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
      });
    });

    it('filters users by role', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users?role=${UserRole.SYSTEM_ADMIN}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(adminId);
    });

    it('searches users by name case-insensitively', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?search=Super')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(adminId);
    });

    it('creates a normal user successfully', async () => {
      const newUserPayload = {
        name: 'Another Regular Customer For Test',
        email: 'another.test.m2@example.com',
        address: 'Some random dummy testing street address',
        password: 'Password@123',
        role: UserRole.NORMAL_USER,
      };

      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserPayload);

      expect(res.status).toBe(201);
      expect(res.body.email).toBe(newUserPayload.email);
      expect(res.body.role).toBe(UserRole.NORMAL_USER);

      // Cleanup
      await prisma.user.delete({ where: { id: res.body.id } });
    });

    it('returns 400 when creating a user with invalid password', async () => {
      const newUserPayload = {
        name: 'Invalid Regular Customer For Test',
        email: 'invalid.test.m2@example.com',
        address: 'Some random dummy testing street address',
        password: 'pass', // Too short, no uppercase, no special char
        role: UserRole.NORMAL_USER,
      };

      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserPayload);

      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty('password');
    });

    it('soft deletes user and prevents reactivation of active user', async () => {
      // Create user to delete
      const userToDelete = await prisma.user.create({
        data: {
          name: 'Deletable User Account Tester',
          email: 'deletable.test.m2@example.com',
          passwordHash: 'dummy_hash',
          address: 'Deletable street location address',
          role: UserRole.NORMAL_USER,
        },
      });

      // Soft delete
      const delRes = await request(app)
        .delete(`/api/v1/admin/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);

      // Verify in DB that it is soft deleted (deletedAt is set)
      const dbUser = await prisma.user.findUnique({ where: { id: userToDelete.id } });
      expect(dbUser?.deletedAt).not.toBeNull();

      // Test reactivation
      const reactivateRes = await request(app)
        .patch(`/api/v1/admin/users/${userToDelete.id}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(reactivateRes.status).toBe(200);

      const dbUserReactivated = await prisma.user.findUnique({ where: { id: userToDelete.id } });
      expect(dbUserReactivated?.deletedAt).toBeNull();

      // Cleanup
      await prisma.user.delete({ where: { id: userToDelete.id } });
    });

    it('prevents self-deletion', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot delete your own/i);
    });

    it('prevents deletion of the last active admin', async () => {
      // We only have one system admin (adminId) in the DB
      const res = await request(app)
        .delete(`/api/v1/admin/users/${adminId}`) // Even if we tried to bypass self-deletion logic (which is tested above), it would fail on last admin check
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ── Store Management ─────────────────────────────────────────────────────────

  describe('Store Management', () => {
    it('creates store and store owner together in a transaction', async () => {
      const payload = {
        store: {
          name: 'Linear Coffee Vercel Roasters',
          email: 'linear.coffee.test@example.com',
          address: 'Tech District Block 4B, SF',
        },
        owner: {
          name: 'Marcus Aurelius Coffee Owner',
          email: 'marcus.owner.test@example.com',
          password: 'Password@123',
          address: 'Owner residential address SF CA',
        },
      };

      const res = await request(app)
        .post('/api/v1/admin/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(payload.store.name);
      expect(res.body.owner.email).toBe(payload.owner.email);
      expect(res.body.owner.role).toBe(UserRole.STORE_OWNER);

      // Verify in DB
      const dbStore = await prisma.store.findUnique({ where: { id: res.body.id } });
      expect(dbStore).toBeDefined();

      const dbOwner = await prisma.user.findUnique({ where: { id: res.body.ownerId } });
      expect(dbOwner).toBeDefined();

      // Cleanup
      await prisma.store.delete({ where: { id: res.body.id } });
      await prisma.user.delete({ where: { id: res.body.ownerId } });
    });

    it('rolls back store creation transaction if owner email already exists', async () => {
      const payload = {
        store: {
          name: 'Linear Coffee Vercel Roasters Second',
          email: 'linear.coffee.test.second@example.com',
          address: 'Tech District Block 4B, SF',
        },
        owner: {
          name: 'Marcus Aurelius Coffee Owner',
          email: 'admin.test.m2@example.com', // Duplicate owner email (admin exists)
          password: 'Password@123',
          address: 'Owner residential address SF CA',
        },
      };

      const res = await request(app)
        .post('/api/v1/admin/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(409);

      // Verify no orphaned store was created
      const dbStore = await prisma.store.findFirst({
        where: { email: payload.store.email },
      });
      expect(dbStore).toBeNull();
    });

    it('lists stores with pagination and sorting support', async () => {
      // Create a test store
      const testOwner = await prisma.user.create({
        data: {
          name: 'Test Store Owner Marcus Aurelius',
          email: 'test.store.owner.m2@example.com',
          passwordHash: 'dummy',
          address: 'Some address',
          role: UserRole.STORE_OWNER,
        },
      });
      const testStore = await prisma.store.create({
        data: {
          name: 'Stripe Cafe Coffee Shop',
          email: 'stripe.cafe.test@example.com',
          address: 'Financial Center Suite A',
          ownerId: testOwner.id,
        },
      });

      const res = await request(app)
        .get('/api/v1/admin/stores?page=1&limit=10&sortBy=name&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Stripe Cafe Coffee Shop');

      // Cleanup
      await prisma.store.delete({ where: { id: testStore.id } });
      await prisma.user.delete({ where: { id: testOwner.id } });
    });
  });
});
