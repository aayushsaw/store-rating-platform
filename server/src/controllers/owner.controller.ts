import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/lib/prisma.js';
import { HttpError } from '@/lib/errors.js';

export async function getOwnerDashboard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ownerId = req.user?.sub;
    if (!ownerId) {
      throw HttpError.unauthorized('Authentication required');
    }

    // Retrieve owned store
    const store = await prisma.store.findUnique({
      where: { ownerId },
    });

    if (!store) {
      throw HttpError.notFound('No store associated with this owner account');
    }

    const storeId = store.id;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const skip = (page - 1) * limit;

    // Get rating counts & average
    const ratingsStats = await prisma.rating.groupBy({
      by: ['value'],
      where: { storeId },
      _count: { id: true },
    });

    const totalRatings = ratingsStats.reduce((sum, item) => sum + item._count.id, 0);
    const sumRatings = ratingsStats.reduce((sum, item) => sum + item.value * item._count.id, 0);
    const averageRating =
      totalRatings > 0 ? parseFloat((sumRatings / totalRatings).toFixed(2)) : null;

    // Setup star distribution breakdown
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingsStats.forEach((stat) => {
      const star = stat.value as 1 | 2 | 3 | 4 | 5;
      if (star in distribution) {
        distribution[star] = stat._count.id;
      }
    });

    // Fetch paginated reviews list
    const [totalReviews, reviews] = await Promise.all([
      prisma.rating.count({ where: { storeId } }),
      prisma.rating.findMany({
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
      }),
    ]);

    res.status(200).json({
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
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
