import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Users,
  Search,
  Plus,
  ArrowUpDown,
  Trash2,
  RotateCcw,
  Loader2,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { adminCreateUserSchema, type AdminCreateUserInput, UserRole } from '@store-rating/shared';
import { useAppSelector } from '@/app/hooks';

interface UserListItem {
  id: string;
  name: string;
  email: string;
  address: string;
  role: string;
  createdAt: string;
  deletedAt: string | null;
}

interface UsersResponse {
  data: UserListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function UserManagement() {
  const currentAdmin = useAppSelector((state) => state.auth.user);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and Query States
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<string>('active');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Modals / Actions
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'delete' | 'reactivate' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder,
        status,
        ...(search && { search }),
        ...(role && { role }),
      });
      const res = await api.get<UsersResponse>(`/admin/users?${params.toString()}`);
      setData(res.data);
    } catch {
      setError('Failed to fetch user list.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder, status, role]);

  // Debounced/Triggered Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // ── Action Handlers ──
  const handleOpenAction = (userId: string, type: 'delete' | 'reactivate') => {
    setActionUserId(userId);
    setActionType(type);
    setActionError(null);
  };

  const handleConfirmAction = async () => {
    if (!actionUserId || !actionType) return;
    setSubmitting(true);
    setActionError(null);
    try {
      if (actionType === 'delete') {
        await api.delete(`/admin/users/${actionUserId}`);
      } else {
        await api.patch(`/admin/users/${actionUserId}/reactivate`);
      }
      setActionUserId(null);
      setActionType(null);
      fetchUsers();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setActionError(errorResponse.response?.data?.message ?? 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Add User Form ──
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<AdminCreateUserInput>({
    resolver: zodResolver(adminCreateUserSchema),
  });

  const onAddSubmit = async (formData: AdminCreateUserInput) => {
    try {
      await api.post('/admin/users', formData);
      setShowAddModal(false);
      reset();
      fetchUsers();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      if (errorResponse.response?.data?.message) {
        setFormError('root', { message: errorResponse.response.data.message });
      } else {
        setFormError('root', { message: 'Failed to create user' });
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-400" />
            User Management
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create, manage, and soft-delete user accounts on the platform.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors self-start"
        >
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-900 bg-zinc-900/10">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search by name, email, address..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <button type="submit" className="hidden" />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter by Role */}
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="input py-2 px-3 pr-8 w-auto min-w-[140px]"
            aria-label="Filter by Role"
          >
            <option value="">All Roles</option>
            <option value={UserRole.SYSTEM_ADMIN}>Admin</option>
            <option value={UserRole.NORMAL_USER}>Customer</option>
            <option value={UserRole.STORE_OWNER}>Store Owner</option>
          </select>

          {/* Filter by Status */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="input py-2 px-3 pr-8 w-auto min-w-[140px]"
            aria-label="Filter by Status"
          >
            <option value="active">Active</option>
            <option value="deleted">Deleted</option>
            <option value="all">All Status</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 overflow-hidden">
        {loading ? (
          // Skeleton Table Loader
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-8 bg-zinc-900 rounded" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-900/60 rounded" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400">{error}</div>
        ) : !data || data.data.length === 0 ? (
          // Empty State
          <div className="p-16 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">No users found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {
                "We couldn't find any users matching your query parameters. Try widening your filters."
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-950 px-6 py-3 text-zinc-500 font-semibold uppercase tracking-wider">
                  <th
                    className="p-4 cursor-pointer hover:text-zinc-300"
                    onClick={() => handleSort('name')}
                  >
                    <span className="flex items-center gap-1.5">
                      Name <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    className="p-4 cursor-pointer hover:text-zinc-300"
                    onClick={() => handleSort('email')}
                  >
                    <span className="flex items-center gap-1.5">
                      Email <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    className="p-4 cursor-pointer hover:text-zinc-300"
                    onClick={() => handleSort('address')}
                  >
                    <span className="flex items-center gap-1.5">
                      Address <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    className="p-4 cursor-pointer hover:text-zinc-300"
                    onClick={() => handleSort('role')}
                  >
                    <span className="flex items-center gap-1.5">
                      Role <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {data.data.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-900/30 text-zinc-300 transition-colors"
                  >
                    <td className="p-4 font-semibold text-zinc-200">{user.name}</td>
                    <td className="p-4 text-zinc-400">{user.email}</td>
                    <td className="p-4 text-zinc-500 truncate max-w-xs">{user.address}</td>
                    <td className="p-4">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                          user.role === 'SYSTEM_ADMIN'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.deletedAt ? (
                        <span className="text-[10px] font-medium text-red-400 border border-red-500/15 bg-red-500/5 px-2 py-0.5 rounded-full">
                          Deleted
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-400 border border-emerald-500/15 bg-emerald-500/5 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {user.deletedAt ? (
                        <button
                          onClick={() => handleOpenAction(user.id, 'reactivate')}
                          className="btn-ghost hover:bg-zinc-800 text-indigo-400 hover:text-indigo-300 p-1.5 rounded inline-flex items-center gap-1"
                          title="Reactivate User"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenAction(user.id, 'delete')}
                          disabled={user.id === currentAdmin?.id}
                          className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded inline-flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-900 pt-4 text-xs">
          <p className="text-zinc-500">
            Showing <span className="font-semibold text-zinc-300">{(page - 1) * 10 + 1}</span> to{' '}
            <span className="font-semibold text-zinc-300">
              {Math.min(page * 10, data.meta.total)}
            </span>{' '}
            of <span className="font-semibold text-zinc-300">{data.meta.total}</span> users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="btn-ghost py-1.5 px-2.5 rounded border border-zinc-900 flex items-center gap-1 disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, data.meta.totalPages))}
              disabled={page === data.meta.totalPages}
              className="btn-ghost py-1.5 px-2.5 rounded border border-zinc-900 flex items-center gap-1 disabled:opacity-30"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">Create new user account</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Admin or Customer account type creation
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onAddSubmit)} noValidate className="space-y-4">
              {errors.root && (
                <div className="alert-error" role="alert">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{errors.root.message}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="label">Full name</label>
                <input
                  type="text"
                  placeholder="Alexander Montgomery Smith"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  {...register('name')}
                />
                {errors.name ? (
                  <p className="field-error">{errors.name.message}</p>
                ) : (
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-600">
                    <Info className="h-3 w-3" /> Minimum 20 characters
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  {...register('email')}
                />
                {errors.email && <p className="field-error">{errors.email.message}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="label">Address</label>
                <input
                  type="text"
                  placeholder="123 Main St, Springfield, IL"
                  className={`input ${errors.address ? 'input-error' : ''}`}
                  {...register('address')}
                />
                {errors.address && <p className="field-error">{errors.address.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                />
                {errors.password && <p className="field-error">{errors.password.message}</p>}
              </div>

              {/* Role */}
              <div>
                <label className="label">Role</label>
                <select className="input" {...register('role')}>
                  <option value={UserRole.NORMAL_USER}>Customer (NORMAL_USER)</option>
                  <option value={UserRole.SYSTEM_ADMIN}>Administrator (SYSTEM_ADMIN)</option>
                </select>
                {errors.role && <p className="field-error">{errors.role.message}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary mt-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating user…
                  </>
                ) : (
                  'Create User'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete / Reactivate Action Confirm Dialog ── */}
      {actionUserId && actionType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setActionUserId(null);
              setActionType(null);
            }}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${actionType === 'delete' ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'}`}
              >
                {actionType === 'delete' ? (
                  <Trash2 className="h-5 w-5" />
                ) : (
                  <RotateCcw className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {actionType === 'delete' ? 'Delete User Account' : 'Reactivate User Account'}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {actionType === 'delete'
                    ? 'Are you sure you want to soft-delete this user account? The user will be instantly logged out and barred from logging in.'
                    : 'Reactivating this user will restore their account login access. They can immediately log in again.'}
                </p>
              </div>
            </div>

            {actionError && (
              <div className="alert-error text-xs" role="alert">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setActionUserId(null);
                  setActionType(null);
                }}
                className="btn-ghost py-2 px-4 rounded text-xs"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={submitting}
                className={`py-2 px-4 rounded text-xs font-semibold text-white transition-colors flex items-center gap-1.5 ${
                  actionType === 'delete'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                {actionType === 'delete' ? 'Delete User' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
