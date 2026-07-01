import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { createApp } from '@/app.js';
import { prisma } from '@/lib/prisma.js';
import { signAccessToken } from '@/lib/jwt.js';
import { UserRole } from '@store-rating/shared';

const app = createApp();
const request = supertest(app);

describe('Ratings & Discovery Endpoints', () => {
  let customerId: string;
  let customerToken: string;
  let ownerToken: string;
  let otherOwnerToken: string;
  let adminToken: string;
  let storeId: string;

  beforeAll(async () => {
    // Clean tables
    await prisma.rating.deleteMany();
    await prisma.store.deleteMany();
    await prisma.user.deleteMany();

    // Create a customer
    const customer = await prisma.user.create({
      data: {
        name: 'Regular Customer Tester Jane',
        email: 'jane.customer@example.com',
        passwordHash: 'dummy_hash',
        address: 'Customer Address Springfield',
        role: UserRole.NORMAL_USER,
      },
    });
    customerId = customer.id;
    customerToken = signAccessToken({
      sub: customer.id,
      email: customer.email,
      role: UserRole.NORMAL_USER,
    });

    // Create an owner
    const owner = await prisma.user.create({
      data: {
        name: 'Marcus Aurelius StoreOwner',
        email: 'marcus.owner@example.com',
        passwordHash: 'dummy_hash',
        address: 'Owner Address Rome',
        role: UserRole.STORE_OWNER,
      },
    });
    ownerToken = signAccessToken({ sub: owner.id, email: owner.email, role: UserRole.STORE_OWNER });

    // Create another owner for authorization checks
    const otherOwner = await prisma.user.create({
      data: {
        name: 'Other Owner Account',
        email: 'other.owner@example.com',
        passwordHash: 'dummy_hash',
        address: 'Other Owner Address',
        role: UserRole.STORE_OWNER,
      },
    });
    otherOwnerToken = signAccessToken({
      sub: otherOwner.id,
      email: otherOwner.email,
      role: UserRole.STORE_OWNER,
    });

    // Create an admin
    const admin = await prisma.user.create({
      data: {
        name: 'System Admin Coordinator',
        email: 'admin.rating@example.com',
        passwordHash: 'dummy_hash',
        address: 'Admin Center',
        role: UserRole.SYSTEM_ADMIN,
      },
    });
    adminToken = signAccessToken({
      sub: admin.id,
      email: admin.email,
      role: UserRole.SYSTEM_ADMIN,
    });

    // Create a store owned by owner
    const store = await prisma.store.create({
      data: {
        name: 'Linear Vercel Coffee Shop',
        email: 'coffee@linear.com',
        address: '789 Silicon Valley Blvd',
        ownerId: owner.id,
      },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    await prisma.rating.deleteMany();
    await prisma.store.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/v1/stores/:id/rating', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request
        .post(`/api/v1/stores/${storeId}/rating`)
        .send({ value: 4, comment: 'Nice place!' });
      expect(res.status).toBe(401);
    });

    it('returns 403 for SYSTEM_ADMIN role', async () => {
      const res = await request
        .post(`/api/v1/stores/${storeId}/rating`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ value: 5, comment: 'I am admin!' });
      expect(res.status).toBe(403);
    });

    it('returns 403 for STORE_OWNER role', async () => {
      const res = await request
        .post(`/api/v1/stores/${storeId}/rating`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ value: 5, comment: 'I am owner!' });
      expect(res.status).toBe(403);
    });

    it('returns 400 for invalid rating value (e.g. 6 stars)', async () => {
      const res = await request
        .post(`/api/v1/stores/${storeId}/rating`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ value: 6, comment: 'Awesome!' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty('value');
    });

    it('submits a new rating successfully as customer', async () => {
      const res = await request
        .post(`/api/v1/stores/${storeId}/rating`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ value: 4, comment: 'Great Coffee and atmosphere!' });
      expect(res.status).toBe(200);
      expect(res.body.rating).toMatchObject({
        value: 4,
        comment: 'Great Coffee and atmosphere!',
      });

      // Verify in DB
      const rating = await prisma.rating.findUnique({
        where: { userId_storeId: { userId: customerId, storeId } },
      });
      expect(rating).not.toBeNull();
      expect(rating?.value).toBe(4);
      expect(rating?.comment).toBe('Great Coffee and atmosphere!');
    });

    it('modifies the existing rating successfully (upsert check)', async () => {
      const res = await request
        .post(`/api/v1/stores/${storeId}/rating`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ value: 5, comment: 'Updated to 5 stars! Exceptional place!' });

      expect(res.status).toBe(200);
      expect(res.body.rating).toMatchObject({
        value: 5,
        comment: 'Updated to 5 stars! Exceptional place!',
      });

      // Verify in DB that it updated and did not duplicate
      const ratings = await prisma.rating.findMany({
        where: { storeId },
      });
      expect(ratings).toHaveLength(1);
      expect(ratings[0].value).toBe(5);
    });
  });

  describe('GET /api/v1/stores', () => {
    it('returns a list of stores with overallRating, ratingsCount, and userRating details', async () => {
      const res = await request
        .get('/api/v1/stores')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        id: storeId,
        name: 'Linear Vercel Coffee Shop',
        overallRating: 5,
        ratingsCount: 1,
        userRating: {
          value: 5,
          comment: 'Updated to 5 stars! Exceptional place!',
        },
      });
    });
  });

  describe('GET /api/v1/stores/:id', () => {
    it('returns detailed store statistics, star distribution histogram, and paginated review list', async () => {
      const res = await request
        .get(`/api/v1/stores/${storeId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.store).toMatchObject({
        id: storeId,
        averageRating: 5,
        totalRatings: 1,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 1 },
      });
      expect(res.body.reviews).toHaveLength(1);
      expect(res.body.reviews[0]).toMatchObject({
        value: 5,
        comment: 'Updated to 5 stars! Exceptional place!',
        user: {
          name: 'Regular Customer Tester Jane',
        },
      });
    });
  });

  describe('GET /api/v1/owner/dashboard', () => {
    it('returns 403 for non-owners (e.g. customer)', async () => {
      const res = await request
        .get('/api/v1/owner/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('returns 404 for owners with no store registered', async () => {
      const res = await request
        .get('/api/v1/owner/dashboard')
        .set('Authorization', `Bearer ${otherOwnerToken}`);
      expect(res.status).toBe(404);
    });

    it('returns dashboard statistics for store owner', async () => {
      const res = await request
        .get('/api/v1/owner/dashboard')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.store).toMatchObject({
        name: 'Linear Vercel Coffee Shop',
        averageRating: 5,
        totalRatings: 1,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 1 },
      });
      expect(res.body.reviews).toHaveLength(1);
      expect(res.body.reviews[0]).toMatchObject({
        value: 5,
        comment: 'Updated to 5 stars! Exceptional place!',
        user: {
          name: 'Regular Customer Tester Jane',
          email: 'jane.customer@example.com',
        },
      });
    });
  });
});
