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

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get<DashboardData>('/admin/dashboard');
        setData(res.data);
      } catch {
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="alert-error flex items-center justify-between p-6">
        <span>{error}</span>
        <button onClick={() => window.location.reload()} className="underline font-semibold">
          Retry
        </button>
      </div>
    );
  }

  // ── Skeleton Loader ──
  if (loading || !data) {
    return (
      <div className="space-y-10 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded bg-zinc-900" />
            <div className="h-4 w-64 rounded bg-zinc-900" />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-zinc-900 bg-zinc-900/30 p-6" />
          ))}
        </div>

        {/* Activity columns skeleton */}
        <div className="grid gap-8 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4 rounded-xl border border-zinc-900 bg-zinc-900/10 p-6">
              <div className="h-6 w-32 rounded bg-zinc-900" />
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-14 rounded bg-zinc-900/50" />
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
      icon: <Users className="h-5 w-5 text-indigo-400" />,
      color: 'text-zinc-100',
    },
    {
      title: 'Active Users',
      value: metrics.activeUsers,
      icon: <UserCheck className="h-5 w-5 text-emerald-400" />,
      color: 'text-zinc-100',
    },
    {
      title: 'Total Stores',
      value: metrics.totalStores,
      icon: <Store className="h-5 w-5 text-purple-400" />,
      color: 'text-zinc-100',
    },
    {
      title: 'Total Ratings',
      value: metrics.totalRatings,
      icon: <TrendingUp className="h-5 w-5 text-amber-400" />,
      color: 'text-zinc-100',
    },
    {
      title: 'Average Rating',
      value: metrics.averageRating > 0 ? `${metrics.averageRating} / 5` : 'N/A',
      icon: <Star className="h-5 w-5 text-rose-400 fill-rose-500/10" />,
      color: 'text-zinc-100',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Overview</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Real-time platform status, user metrics, and store activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add User
          </Link>
          <Link
            to="/admin/stores"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition-colors"
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
            className="card relative overflow-hidden bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-zinc-800 transition-all duration-200"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className="rounded-lg bg-zinc-950 p-2 border border-zinc-900">{card.icon}</div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-2xl font-bold tracking-tight ${card.color}`}>
                {card.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <Activity className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">
            Recent activity
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Users */}
          <div className="card bg-zinc-900/20 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300">New Users</h3>
                <Link
                  to="/admin/users"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {activity.recentUsers.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-600">
                  No users registered yet
                </div>
              ) : (
                <div className="divide-y divide-zinc-900">
                  {activity.recentUsers.map((user) => (
                    <div key={user.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-300 truncate">{user.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase ${
                            user.role === 'SYSTEM_ADMIN'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
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
          <div className="card bg-zinc-900/20 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300">New Stores</h3>
                <Link
                  to="/admin/stores"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {activity.recentStores.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-600">No stores created yet</div>
              ) : (
                <div className="divide-y divide-zinc-900">
                  {activity.recentStores.map((store) => (
                    <div key={store.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-300 truncate">{store.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">
                          Owner: {store.owner.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
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
          <div className="card bg-zinc-900/20 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300">New Ratings</h3>
                <span className="text-[10px] text-zinc-500">Milestone M3 Preview</span>
              </div>

              {activity.recentRatings.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-600">
                  No ratings submitted yet
                </div>
              ) : (
                <div className="divide-y divide-zinc-900">
                  {activity.recentRatings.map((rating) => (
                    <div key={rating.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-300 truncate">
                          {rating.user.name} rated{' '}
                          <span className="text-indigo-400 font-semibold">{rating.store.name}</span>
                        </p>
                        <p className="text-[10px] text-zinc-500">Submitted in Milestone M3</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-zinc-300">{rating.value}</span>
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
