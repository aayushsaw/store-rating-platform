import { useEffect, useState } from 'react';
import {
  Store,
  Star,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  ShieldAlert,
} from 'lucide-react';
import { api } from '@/lib/api';

interface ReviewItem {
  id: string;
  value: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface OwnerStoreStats {
  id: string;
  name: string;
  email: string;
  address: string;
  averageRating: number | null;
  totalRatings: number;
  distribution: Record<number, number>;
}

interface OwnerDashboardResponse {
  store: OwnerStoreStats;
  reviews: ReviewItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function OwnerDashboard() {
  const [data, setData] = useState<OwnerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<OwnerDashboardResponse>(`/owner/dashboard?page=${page}&limit=5`);
      setData(res.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setError('NO_STORE');
      } else {
        setError('Failed to fetch dashboard statistics.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const renderStars = (rating: number, size = 'h-4 w-4') => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${size} ${
              i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="space-y-8 animate-pulse p-6">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-zinc-900 rounded" />
          <div className="h-4 w-72 bg-zinc-900 rounded" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-900 rounded-xl border border-zinc-900" />
          ))}
        </div>
        <div className="h-96 bg-zinc-900 rounded-xl border border-zinc-900" />
      </div>
    );
  }

  if (error === 'NO_STORE') {
    return (
      <div className="flex items-center justify-center p-12 min-h-[calc(100vh-8rem)]">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-zinc-200">Store mapping missing</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            There is currently no store registered under your owner account. Please contact a system
            administrator to create and link your store.
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="alert-error flex items-center justify-between p-6">
          <span>{error || 'An unexpected error occurred.'}</span>
          <button onClick={() => fetchDashboardData()} className="underline font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { store, reviews, meta } = data;

  // Calculate 5-star percentage/counts
  const fiveStarCount = store.distribution[5] || 0;

  const statCards = [
    {
      title: 'Overall Rating',
      value: store.averageRating !== null ? `${store.averageRating} / 5` : 'N/A',
      icon: <Star className="h-5 w-5 text-amber-400 fill-amber-500/10" />,
    },
    {
      title: 'Total Reviews',
      value: store.totalRatings,
      icon: <MessageSquare className="h-5 w-5 text-indigo-400" />,
    },
    {
      title: '5-Star Ratings',
      value: fiveStarCount,
      icon: <Users className="h-5 w-5 text-emerald-400" />,
    },
  ];

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex items-start gap-4 border-b border-zinc-900 pb-6">
        <div className="h-12 w-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{store.name}</h1>
          <p className="text-xs text-zinc-500 mt-1">Owned Store Dashboard · {store.address}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.title} className="card bg-zinc-900/40 border border-zinc-900">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className="rounded-lg bg-zinc-950 p-2 border border-zinc-900">{card.icon}</div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-zinc-100">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Star Rating Distribution Histogram */}
        <div className="card bg-zinc-900/20 border border-zinc-900 space-y-5 p-5">
          <div>
            <h3 className="font-semibold text-sm text-zinc-300">Ratings breakdown</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Rating weight distribution stats.</p>
          </div>

          <div className="space-y-3.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = store.distribution[stars] || 0;
              const percentage = store.totalRatings > 0 ? (count / store.totalRatings) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-10 text-zinc-400 font-semibold text-right shrink-0">
                    {stars} Star
                  </span>
                  <div className="flex-grow h-2 rounded bg-zinc-900 overflow-hidden border border-zinc-800/40">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-zinc-500 text-right shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Customer Reviews Feed */}
        <div className="lg:col-span-2 card bg-zinc-900/20 border border-zinc-900 flex flex-col justify-between p-5 space-y-6">
          <div className="space-y-4 flex-grow">
            <div>
              <h3 className="font-semibold text-sm text-zinc-300">Submitted customer ratings</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Written feedback list left by customers.
              </p>
            </div>

            {reviews.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-600">
                No ratings submitted for your store yet.
              </div>
            ) : (
              <div className="divide-y divide-zinc-900 space-y-4">
                {reviews.map((review) => {
                  const initials = review.user.name
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase();
                  return (
                    <div key={review.id} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                            {initials || <User className="h-3 w-3" />}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-zinc-300">
                              {review.user.name}
                            </p>
                            <p className="text-[9px] text-zinc-500 flex items-center gap-0.5">
                              <Calendar className="h-2.5 w-2.5" />
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div>{renderStars(review.value)}</div>
                      </div>

                      {review.comment ? (
                        <p className="text-xs text-zinc-400 leading-relaxed pl-1">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-600 italic pl-1">
                          Left rating with no written comment.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-900 pt-4 text-xs shrink-0">
              <p className="text-zinc-500">
                Page <span className="font-semibold text-zinc-300">{page}</span> of{' '}
                <span className="font-semibold text-zinc-300">{meta.totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="btn-ghost p-1.5 border border-zinc-900 rounded disabled:opacity-20"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
                  disabled={page === meta.totalPages}
                  className="btn-ghost p-1.5 border border-zinc-900 rounded disabled:opacity-20"
                  aria-label="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
