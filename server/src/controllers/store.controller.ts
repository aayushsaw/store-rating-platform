import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/lib/prisma.js';
import { HttpError } from '@/lib/errors.js';
import { type StoreQueryInput, type SubmitRatingInput } from '@store-rating/shared';

// ─── Store Discovery & Searching ─────────────────────────────────────────────

export async function listStores(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      throw HttpError.unauthorized('Authentication required');
    }

    const { page, limit, search, sortBy, sortOrder } = req.query as unknown as StoreQueryInput;
    const offset = (page - 1) * limit;
    const searchPattern = search ? `%${search}%` : '%';

    // Count matching stores
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count FROM stores s
      WHERE s.name ILIKE ${searchPattern} OR s.address ILIKE ${searchPattern}
    `;
    const total = Number(countResult[0].count);

    // Apply sorting clauses
    let orderByClause = '';
    if (sortBy === 'overallRating') {
      orderByClause = `ORDER BY "overallRating" ${sortOrder}`;
    } else if (sortBy === 'createdAt') {
      orderByClause = `ORDER BY s.created_at ${sortOrder}`;
    } else {
      orderByClause = `ORDER BY s.${sortBy} ${sortOrder}`;
    }

    // Raw query to fetch stores, counts, and user's specific rating details
    const stores = (await prisma.$queryRawUnsafe<unknown[]>(
      `
      SELECT s.id, s.name, s.email, s.address, s.created_at as "createdAt", s.updated_at as "updatedAt",
             COALESCE(AVG(r.value), 0)::float as "overallRating",
             COUNT(r.id)::int as "ratingsCount",
             (SELECT value FROM ratings WHERE store_id = s.id AND user_id = $4::uuid)::int as "userRatingValue",
             (SELECT comment FROM ratings WHERE store_id = s.id AND user_id = $4::uuid)::text as "userRatingComment"
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
      userId,
    )) as Array<{
      id: string;
      name: string;
      email: string;
      address: string;
      createdAt: Date;
      updatedAt: Date;
      overallRating: number;
      ratingsCount: number;
      userRatingValue: number | null;
      userRatingComment: string | null;
    }>;

    res.status(200).json({
      data: stores.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        address: s.address,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        overallRating: s.overallRating > 0 ? parseFloat(s.overallRating.toFixed(2)) : null,
        ratingsCount: s.ratingsCount,
        userRating: s.userRatingValue
          ? {
              value: s.userRatingValue,
              comment: s.userRatingComment,
            }
          : null,
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

// ─── Store Reviews & Details ──────────────────────────────────────────────────

export async function getStoreDetail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const storeId = req.params.id as string;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '5', 10);
    const skip = (page - 1) * limit;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw HttpError.notFound('Store not found');
    }

    // Get overall stats & counts
    const ratingsStats = await prisma.rating.groupBy({
      by: ['value'],
      where: { storeId },
      _count: { id: true },
    });

    const totalRatings = ratingsStats.reduce((sum, item) => sum + (item._count?.id ?? 0), 0);
    const sumRatings = ratingsStats.reduce(
      (sum, item) => sum + item.value * (item._count?.id ?? 0),
      0,
    );
    const averageRating =
      totalRatings > 0 ? parseFloat((sumRatings / totalRatings).toFixed(2)) : null;

    // Calculate rating counts for 1-5 stars
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingsStats.forEach((stat) => {
      const star = stat.value as 1 | 2 | 3 | 4 | 5;
      if (star in distribution) {
        distribution[star] = stat._count?.id ?? 0;
      }
    });

    // Fetch paginated reviews list
    const totalReviews = await prisma.rating.count({ where: { storeId } });
    const reviews = await prisma.rating.findMany({
      where: { storeId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      store: {
        ...store,
        averageRating,
        totalRatings,
        distribution,
      },
      reviews: reviews.map((r) => ({
        id: r.id,
        value: r.value,
        comment: r.comment,
        createdAt: r.createdAt,
        user: {
          name: r.user.name,
          email: r.user.email,
        },
      })),
      meta: {
        page,
        limit,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Submit / Modify Ratings ──────────────────────────────────────────────────

export async function submitRating(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const storeId = req.params.id as string;
    const userId = req.user?.sub;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      throw HttpError.unauthorized('Authentication required');
    }

    // Role Guard: Only NORMAL_USER can rate stores
    if (userRole !== 'NORMAL_USER') {
      throw HttpError.forbidden('Only customers can submit store ratings');
    }

    const { value, comment } = req.body as SubmitRatingInput;

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) {
      throw HttpError.notFound('Store not found');
    }

    // Upsert rating (handles create & modify)
    const rating = await prisma.rating.upsert({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
      update: {
        value,
        comment,
      },
      create: {
        userId,
        storeId,
        value,
        comment,
      },
    });

    res.status(200).json({
      message: 'Rating submitted successfully',
      rating: {
        id: rating.id,
        value: rating.value,
        comment: rating.comment,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
