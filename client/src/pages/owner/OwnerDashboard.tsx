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

  const renderStars = (rating: number, size = 'h-3.5 w-3.5') => {
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

  // ── Skeleton Loader (Trustpilot style layout) ──
  if (loading && !data) {
    return (
      <div className="space-y-8 p-6 max-w-5xl mx-auto animate-pulse">
        <div className="flex items-start gap-4 border-b border-[#1f1f23]/60 pb-6">
          <div className="h-11 w-11 bg-zinc-900 rounded-xl" />
          <div className="space-y-2">
            <div className="h-5 w-44 bg-zinc-900 rounded" />
            <div className="h-3 w-64 bg-zinc-900 rounded" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900/40 rounded-xl border border-[#1f1f23]/60" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-60 bg-zinc-900/20 rounded-xl border border-[#1f1f23]/60" />
          <div className="lg:col-span-2 h-80 bg-zinc-900/20 rounded-xl border border-[#1f1f23]/60" />
        </div>
      </div>
    );
  }

  // ── Empty State: Store mapping missing ──
  if (error === 'NO_STORE') {
    return (
      <div className="flex items-center justify-center p-12 min-h-[calc(100vh-8rem)] animate-scale-in">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto h-11 w-11 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-200">Store mapping missing</h2>
            <p className="text-xs text-zinc-550 leading-relaxed mt-1">
              There is currently no store registered under your owner profile. Please contact a
              system administrator to link your store.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Connection Error Screen ──
  if (error || !data) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[calc(100vh-8rem)] animate-scale-in">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto h-11 w-11 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-200">Connection error</h2>
            <p className="text-xs text-zinc-550 mt-1 leading-relaxed">
              {error || 'An unexpected error occurred.'}
            </p>
          </div>
          <button
            onClick={() => fetchDashboardData()}
            className="btn-primary py-2 px-4 mx-auto text-xs font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { store, reviews, meta } = data;
  const fiveStarCount = store.distribution[5] || 0;

  const statCards = [
    {
      title: 'Overall Rating',
      value: store.averageRating !== null ? `${store.averageRating} / 5` : 'N/A',
      icon: <Star className="h-4 w-4 text-amber-400 fill-amber-500/10" />,
      tag: 'Store average score',
    },
    {
      title: 'Total Reviews',
      value: store.totalRatings,
      icon: <MessageSquare className="h-4 w-4 text-indigo-400" />,
      tag: 'Submitted star ratings',
    },
    {
      title: '5-Star Ratings',
      value: fiveStarCount,
      icon: <Users className="h-4 w-4 text-emerald-400" />,
      tag: 'Exemplary feedback count',
    },
  ];

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Dashboard Header */}
      <div className="flex items-start gap-4 border-b border-[#1f1f23]/60 pb-6">
        <div className="h-11 w-11 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm shrink-0">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-100">{store.name}</h1>
          <p className="text-xs text-zinc-550 mt-1 leading-none">
            Owned Store Dashboard · {store.address}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="card bg-[#0c0c0e]/30 border border-[#1f1f23] hover:border-[#2e2e33] transition-all duration-200"
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">
                {card.title}
              </span>
              <div className="rounded-md bg-zinc-950 p-1.5 border border-[#1f1f23]">
                {card.icon}
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <span className="text-2xl font-bold tracking-tight text-zinc-100">{card.value}</span>
              <p className="text-[9px] text-zinc-650 leading-none">{card.tag}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Star Rating Distribution Histogram */}
        <div className="card bg-[#0c0c0e]/10 border border-[#1f1f23] space-y-5 p-5">
          <div>
            <h3 className="font-bold text-xs text-zinc-300">Ratings distribution</h3>
            <p className="text-[10px] text-zinc-550 mt-1">Review weight aggregates ledger.</p>
          </div>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = store.distribution[stars] || 0;
              const percentage = store.totalRatings > 0 ? (count / store.totalRatings) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2.5 text-[10px]">
                  <span className="w-10 text-zinc-450 font-bold text-right shrink-0">
                    {stars} Star
                  </span>
                  <div className="flex-grow h-1.5 rounded bg-zinc-950 overflow-hidden border border-[#1f1f23]">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-6 text-zinc-500 text-right shrink-0 font-semibold">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Customer Reviews Feed */}
        <div className="lg:col-span-2 card bg-[#0c0c0e]/10 border border-[#1f1f23] flex flex-col justify-between p-5 space-y-6">
          <div className="space-y-4 flex-grow">
            <div>
              <h3 className="font-bold text-xs text-zinc-300">Submitted customer ratings</h3>
              <p className="text-[10px] text-zinc-555 mt-1">
                Written feedback ledger left by customers.
              </p>
            </div>

            {reviews.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-650">
                No ratings submitted for your store yet.
              </div>
            ) : (
              <div className="divide-y divide-[#1f1f23]/60 space-y-4">
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
                          <div className="h-7 w-7 rounded-full bg-zinc-900 border border-[#1f1f23] flex items-center justify-center text-[10px] font-bold text-indigo-400">
                            {initials || <User className="h-3 w-3" />}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-zinc-300">{review.user.name}</p>
                            <p className="text-[9px] text-zinc-550 flex items-center gap-0.5 mt-0.5">
                              <Calendar className="h-2.5 w-2.5" />
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div>{renderStars(review.value)}</div>
                      </div>

                      {review.comment ? (
                        <p className="text-[11px] text-zinc-400 leading-relaxed pl-1">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="text-[11px] text-zinc-600 italic pl-1 leading-relaxed">
                          Left rating with no written feedback.
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
            <div className="flex items-center justify-between border-t border-[#1f1f23]/60 pt-4 text-xs shrink-0">
              <p className="text-zinc-550 text-[10px]">
                Page <span className="font-semibold text-zinc-300">{page}</span> of{' '}
                <span className="font-semibold text-zinc-300">{meta.totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="btn-ghost p-1.5 border border-[#1f1f23] rounded-lg disabled:opacity-20"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
                  disabled={page === meta.totalPages}
                  className="btn-ghost p-1.5 border border-[#1f1f23] rounded-lg disabled:opacity-20"
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
