import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  Store,
  Star,
  Activity,
  Plus,
  Clock,
  ArrowRight,
  TrendingUp,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardData {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalStores: number;
    totalRatings: number;
    averageRating: number;
  };
  activity: {
    recentUsers: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
      deletedAt: string | null;
    }>;
    recentStores: Array<{
      id: string;
      name: string;
      email: string;
      address: string;
      createdAt: string;
      owner: {
        name: string;
        email: string;
      };
    }>;
    recentRatings: Array<{
      id: string;
      value: number;
      createdAt: string;
      user: {
        name: string;
      };
      store: {
        name: string;
      };
    }>;
  };
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<DashboardData>('/admin/dashboard');
      setData(res.data);
    } catch {
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  // ── Error State ──
  if (error) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[calc(100vh-12rem)] animate-scale-in">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto h-11 w-11 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-200">Failed to load statistics</h2>
            <p className="text-xs text-zinc-550 mt-1 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => fetchStats()}
            className="btn-primary py-2 px-4 mx-auto text-xs font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ── Skeleton Loader (Stripe-style Flat Grid) ──
  if (loading || !data) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-zinc-900 rounded" />
            <div className="h-3 w-56 bg-zinc-900 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-zinc-900 rounded-lg" />
            <div className="h-9 w-20 bg-zinc-900 rounded-lg" />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-[#1f1f23]/60 bg-[#0c0c0e]/40 p-5 space-y-3"
            />
          ))}
        </div>

        {/* Activity columns skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="space-y-4 rounded-xl border border-[#1f1f23]/60 bg-[#0c0c0e]/20 p-5"
            >
              <div className="h-5 w-24 bg-zinc-900 rounded" />
              <div className="space-y-2.5">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-12 bg-zinc-900/40 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { metrics, activity } = data;

  const statCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      icon: <Users className="h-4 w-4 text-indigo-400" />,
      tag: 'Platform accounts',
    },
    {
      title: 'Active Users',
      value: metrics.activeUsers,
      icon: <UserCheck className="h-4 w-4 text-emerald-400" />,
      tag: 'Excludes soft deleted',
    },
    {
      title: 'Total Stores',
      value: metrics.totalStores,
      icon: <Store className="h-4 w-4 text-purple-400" />,
      tag: 'Registered venues',
    },
    {
      title: 'Total Ratings',
      value: metrics.totalRatings,
      icon: <TrendingUp className="h-4 w-4 text-amber-400" />,
      tag: 'Submitted stars',
    },
    {
      title: 'Average Rating',
      value: metrics.averageRating > 0 ? `${metrics.averageRating} / 5` : 'N/A',
      icon: <Star className="h-4 w-4 text-rose-450 fill-rose-500/10" />,
      tag: 'Store aggregate mean',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-150">Overview</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Real-time platform status, user metrics, and store activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/users"
            className="flex items-center gap-1.5 rounded-lg bg-[#0c0c0e] border border-[#1f1f23] hover:border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add User
          </Link>
          <Link
            to="/admin/stores"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/5 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Store
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="card relative overflow-hidden bg-[#0c0c0e]/30 border border-[#1f1f23] hover:border-[#2e2e33] transition-all duration-200"
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
              <p className="text-[9px] text-zinc-600 leading-none">{card.tag}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1f1f23]/60 pb-3">
          <Activity className="h-3.5 w-3.5 text-indigo-400" />
          <h2 className="text-xs font-bold tracking-wide text-zinc-300 uppercase">
            Recent activity ledger
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Users */}
          <div className="card bg-[#0c0c0e]/10 border border-[#1f1f23] flex flex-col justify-between p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300">New User Accounts</h3>
                <Link
                  to="/admin/users"
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-semibold"
                >
                  View ledger <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {activity.recentUsers.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-600">
                  No users registered yet
                </div>
              ) : (
                <div className="divide-y divide-[#1f1f23]/50">
                  {activity.recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-350 truncate">{user.name}</p>
                        <p className="text-[10px] text-zinc-550 truncate mt-0.5">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            user.role === 'SYSTEM_ADMIN'
                              ? 'bg-amber-500/10 text-amber-405 border border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-455 border border-indigo-500/20'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Stores */}
          <div className="card bg-[#0c0c0e]/10 border border-[#1f1f23] flex flex-col justify-between p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300">Recently Added Stores</h3>
                <Link
                  to="/admin/stores"
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-semibold"
                >
                  View ledger <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {activity.recentStores.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-600">No stores created yet</div>
              ) : (
                <div className="divide-y divide-[#1f1f23]/50">
                  {activity.recentStores.map((store) => (
                    <div
                      key={store.id}
                      className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-355 truncate">{store.name}</p>
                        <p className="text-[10px] text-zinc-550 truncate mt-0.5">
                          Owner: {store.owner.name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(store.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Ratings */}
          <div className="card bg-[#0c0c0e]/10 border border-[#1f1f23] flex flex-col justify-between p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300">Recent Store Ratings</h3>
                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-900 border border-[#1f1f23] text-zinc-500">
                  Live
                </span>
              </div>

              {activity.recentRatings.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-600">
                  No ratings submitted yet
                </div>
              ) : (
                <div className="divide-y divide-[#1f1f23]/50">
                  {activity.recentRatings.map((rating) => (
                    <div
                      key={rating.id}
                      className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-350 truncate">
                          {rating.user.name} rated{' '}
                          <span className="text-indigo-400">{rating.store.name}</span>
                        </p>
                        <p className="text-[10px] text-zinc-650 mt-0.5">Platform Feedback</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 ml-2">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-zinc-305 text-[10px]">{rating.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
