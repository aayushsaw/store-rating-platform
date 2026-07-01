import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma.js';
import { HttpError } from '@/lib/errors.js';
import { logger } from '@/lib/logger.js';
import { env } from '@/config/env.js';
import { UserRole, type UserQueryInput, type StoreQueryInput } from '@store-rating/shared';
import { Prisma } from '@prisma/client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuditMeta(req: Request) {
  const ua = req.headers['user-agent'];
  const userAgent = typeof ua === 'string' ? ua : 'unknown';
  return {
    audit: true,
    adminId: req.user?.sub,
    adminEmail: req.user?.email,
    ipAddress: req.ip ?? req.socket.remoteAddress ?? 'unknown',
    userAgent,
  };
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info(getAuditMeta(req), 'Audit: Admin accessed dashboard stats');
    const [totalUsers, activeUsers, totalStores, totalRatings, avgRatingAggregate] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.store.count(),
        prisma.rating.count(),
        prisma.rating.aggregate({
          _avg: {
            value: true,
          },
        }),
      ]);

    const averageRating = avgRatingAggregate._avg.value
      ? parseFloat(avgRatingAggregate._avg.value.toFixed(2))
      : 0;

    // Fetch recent additions for the dashboard activity widget
    const [recentUsers, recentStores, recentRatings] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          deletedAt: true,
        },
      }),
      prisma.store.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.rating.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: {
              name: true,
            },
          },
          store: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      metrics: {
        totalUsers,
        activeUsers,
        totalStores,
        totalRatings,
        averageRating,
      },
      activity: {
        recentUsers,
        recentStores,
        recentRatings,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── User Management ──────────────────────────────────────────────────────────

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, search, role, status, sortBy, sortOrder } =
      req.query as unknown as UserQueryInput;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status === 'active') {
      where.deletedAt = null;
    } else if (status === 'deleted') {
      where.deletedAt = { not: null };
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
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
      }),
    ]);

    res.status(200).json({
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserDetail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      next(HttpError.notFound('User not found'));
      return;
    }

    let storeAverageRating: number | null = null;

    if (user.role === UserRole.STORE_OWNER) {
      const store = await prisma.store.findUnique({
        where: { ownerId: user.id },
      });
      if (store) {
        const ratingAgg = await prisma.rating.aggregate({
          where: { storeId: store.id },
          _avg: {
            value: true,
          },
        });
        storeAverageRating = ratingAgg._avg.value ? parseFloat(ratingAgg._avg.value.toFixed(2)) : 0;
      }
    }

    res.status(200).json({
      ...user,
      storeAverageRating,
    });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, address, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      next(HttpError.conflict('User with this email already exists'));
      return;
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        address,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(
      {
        ...getAuditMeta(req),
        action: 'user.create',
        targetUserId: user.id,
        targetEmail: user.email,
        targetRole: user.role,
      },
      `Audit: Admin created user ${user.email} with role ${user.role}`,
    );

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function softDeleteUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.sub;

    if (id === adminId) {
      next(HttpError.badRequest('You cannot delete your own administrator account'));
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      next(HttpError.notFound('User not found'));
      return;
    }

    if (targetUser.deletedAt) {
      next(HttpError.badRequest('User is already deleted'));
      return;
    }

    // Check if target is system admin, and if so, make sure there is at least one other active system admin
    if (targetUser.role === UserRole.SYSTEM_ADMIN) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: UserRole.SYSTEM_ADMIN,
          deletedAt: null,
        },
      });

      if (activeAdminCount <= 1) {
        next(HttpError.badRequest('Cannot delete the last active administrator'));
        return;
      }
    }

    // Soft delete user and revoke all refresh tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    logger.info(
      {
        ...getAuditMeta(req),
        action: 'user.delete',
        targetUserId: id,
        targetEmail: targetUser.email,
      },
      `Audit: Admin soft-deleted user ${targetUser.email}`,
    );

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function reactivateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      next(HttpError.notFound('User not found'));
      return;
    }

    if (!targetUser.deletedAt) {
      next(HttpError.badRequest('User is already active'));
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        deletedAt: true,
      },
    });

    logger.info(
      {
        ...getAuditMeta(req),
        action: 'user.reactivate',
        targetUserId: id,
        targetEmail: targetUser.email,
      },
      `Audit: Admin reactivated user ${targetUser.email}`,
    );

    res.status(200).json({
      message: 'User reactivated successfully',
      user,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Store Management ─────────────────────────────────────────────────────────

export async function listStores(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, search, sortBy, sortOrder } = req.query as unknown as StoreQueryInput;

    const offset = (page - 1) * limit;
    const searchPattern = search ? `%${search}%` : '%';

    // Count query
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count FROM stores s
      WHERE s.name ILIKE ${searchPattern} OR s.address ILIKE ${searchPattern}
    `;
    const total = Number(countResult[0].count);

    // Dynamic ordering to support sorting by overallRating
    let orderByClause = '';
    if (sortBy === 'overallRating') {
      orderByClause = `ORDER BY "overallRating" ${sortOrder}`;
    } else if (sortBy === 'createdAt') {
      orderByClause = `ORDER BY s.created_at ${sortOrder}`;
    } else {
      orderByClause = `ORDER BY s.${sortBy} ${sortOrder}`;
    }

    // Main raw query to select stores with average rating calculations
    const stores = (await prisma.$queryRawUnsafe<unknown[]>(
      `
      SELECT s.id, s.name, s.email, s.address, s.owner_id as "ownerId", s.created_at as "createdAt", s.updated_at as "updatedAt",
             COALESCE(AVG(r.value), 0)::float as "overallRating"
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE s.name ILIKE $1 OR s.address ILIKE $1
      GROUP BY s.id
      ${orderByClause}
      LIMIT $2 OFFSET $3
    `,
      searchPattern,
      limit,
      offset,
    )) as Array<{
      id: string;
      name: string;
      email: string;
      address: string;
      ownerId: string;
      createdAt: Date;
      updatedAt: Date;
      overallRating: number;
    }>;

    res.status(200).json({
      data: stores.map((s) => ({
        ...s,
        overallRating: s.overallRating > 0 ? parseFloat(s.overallRating.toFixed(2)) : null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createStoreWithOwner(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { store: storeData, owner: ownerData } = req.body;

    // Check duplicate email for owner
    const existingOwner = await prisma.user.findUnique({
      where: { email: ownerData.email },
    });
    if (existingOwner) {
      next(HttpError.conflict('A user with the owner email already exists'));
      return;
    }

    // Check duplicate email for store
    const existingStore = await prisma.store.findUnique({
      where: { email: storeData.email },
    });
    if (existingStore) {
      next(HttpError.conflict('A store with this email already exists'));
      return;
    }

    const passwordHash = await bcrypt.hash(ownerData.password, env.bcryptRounds);

    // Create owner and store in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      const owner = await tx.user.create({
        data: {
          name: ownerData.name,
          email: ownerData.email,
          address: ownerData.address,
          passwordHash,
          role: UserRole.STORE_OWNER,
        },
      });

      const store = await tx.store.create({
        data: {
          name: storeData.name,
          email: storeData.email,
          address: storeData.address,
          ownerId: owner.id,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              address: true,
              role: true,
            },
          },
        },
      });

      return store;
    });

    logger.info(
      {
        ...getAuditMeta(req),
        action: 'store.create',
        storeId: result.id,
        storeEmail: result.email,
        ownerId: result.owner.id,
        ownerEmail: result.owner.email,
      },
      `Audit: Admin created store ${result.name} and owner ${result.owner.email}`,
    );

    res.status(201).json({
      ...result,
      overallRating: null,
    });
  } catch (err) {
    next(err);
  }
}
