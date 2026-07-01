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
      setError('Failed to fetch user accounts list.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder, status, role]);

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-150 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            User Management
          </h1>
          <p className="mt-0.5 text-xs text-zinc-550">
            Create, manage, and soft-delete user accounts on the platform.
          </p>
        </div>
        <button
          onClick={() => {
            reset();
            setShowAddModal(true);
          }}
          className="btn-primary self-start shadow-md shadow-indigo-650/5 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Create User
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-[#1f1f23] bg-[#0c0c0e]/30">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search users..."
            className="input pl-9 py-2 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <button type="submit" className="hidden" />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="input py-2 px-3 pr-8 w-auto min-w-[130px] text-xs bg-[#09090b]"
            aria-label="Filter by Role"
          >
            <option value="">All Roles</option>
            <option value={UserRole.SYSTEM_ADMIN}>Admin</option>
            <option value={UserRole.NORMAL_USER}>Customer</option>
            <option value={UserRole.STORE_OWNER}>Store Owner</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="input py-2 px-3 pr-8 w-auto min-w-[130px] text-xs bg-[#09090b]"
            aria-label="Filter by Status"
          >
            <option value="active">Active</option>
            <option value="deleted">Deleted</option>
            <option value="all">All Status</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-[#1f1f23] bg-[#0c0c0e]/10 overflow-hidden">
        {loading ? (
          // Skeleton Table Loader
          <div className="p-5 space-y-3.5 animate-pulse">
            <div className="h-6 bg-zinc-900 rounded-lg w-1/4" />
            <div className="border-t border-[#1f1f23]/60 pt-4 space-y-2.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-11 bg-zinc-900/40 rounded-lg" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400 text-xs">{error}</div>
        ) : !data || data.data.length === 0 ? (
          // Empty State
          <div className="p-16 text-center space-y-3">
            <div className="mx-auto h-11 w-11 rounded-full bg-zinc-950 border border-[#1f1f23] flex items-center justify-center text-zinc-550">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-300">No users found</h3>
              <p className="text-[11px] text-zinc-550 max-w-xs mx-auto mt-1 leading-normal">
                We couldn&apos;t find any user profiles matching your current filters. Try refining
                your queries.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1f1f23] bg-[#0c0c0e]/60 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <th
                    className="p-4 cursor-pointer hover:text-zinc-300 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <span className="flex items-center gap-1.5">
                      Name <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    className="p-4 cursor-pointer hover:text-zinc-300 transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    <span className="flex items-center gap-1.5">
                      Email <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    className="p-4 cursor-pointer hover:text-zinc-300 transition-colors"
                    onClick={() => handleSort('address')}
                  >
                    <span className="flex items-center gap-1.5">
                      Address <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    className="p-4 cursor-pointer hover:text-zinc-300 transition-colors"
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
              <tbody className="divide-y divide-[#1f1f23]/60 text-zinc-350">
                {data.data.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#18181b]/35 transition-colors duration-100"
                  >
                    <td className="p-4 font-bold text-zinc-200">{user.name}</td>
                    <td className="p-4 text-zinc-400">{user.email}</td>
                    <td className="p-4 text-zinc-500 max-w-xs truncate">{user.address}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
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
                        <span className="text-[9px] font-bold text-red-400 border border-red-500/15 bg-red-500/5 px-2 py-0.5 rounded-full">
                          Deleted
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-emerald-400 border border-emerald-500/15 bg-emerald-500/5 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {user.deletedAt ? (
                        <button
                          onClick={() => handleOpenAction(user.id, 'reactivate')}
                          className="btn-ghost hover:bg-[#18181b] text-indigo-400 hover:text-indigo-300 p-1.5 rounded-lg inline-flex items-center gap-1 font-semibold"
                          title="Reactivate User"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenAction(user.id, 'delete')}
                          disabled={user.id === currentAdmin?.id}
                          className="btn-danger hover:bg-red-500/5 hover:text-red-300 p-1.5 rounded-lg inline-flex items-center gap-1 disabled:opacity-20 disabled:cursor-not-allowed font-semibold border border-transparent hover:border-red-500/10"
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
        <div className="flex items-center justify-between border-t border-[#1f1f23]/60 pt-4 text-xs">
          <p className="text-zinc-500">
            Showing <span className="font-semibold text-zinc-350">{(page - 1) * 10 + 1}</span> to{' '}
            <span className="font-semibold text-zinc-355">
              {Math.min(page * 10, data.meta.total)}
            </span>{' '}
            of <span className="font-semibold text-zinc-355">{data.meta.total}</span> users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="btn-ghost p-1.5 rounded-lg border border-[#1f1f23] flex items-center gap-1 disabled:opacity-20"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, data.meta.totalPages))}
              disabled={page === data.meta.totalPages}
              className="btn-ghost p-1.5 rounded-lg border border-[#1f1f23] flex items-center gap-1 disabled:opacity-20"
              aria-label="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-[#1f1f23] bg-[#0c0c0e] p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-200">Create User Profile</h2>
                <p className="text-[11px] text-zinc-550 mt-1">
                  Register a customer or administrator.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-[#18181b] hover:text-zinc-300 transition-colors"
                aria-label="Close dialog"
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
                  className={`input text-xs ${errors.name ? 'input-error' : ''}`}
                  {...register('name')}
                />
                {errors.name ? (
                  <p className="field-error">{errors.name.message}</p>
                ) : (
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-650">
                    <Info className="h-3.5 w-3.5" /> Must be 12–60 characters.
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className={`input text-xs ${errors.email ? 'input-error' : ''}`}
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
                  className={`input text-xs ${errors.address ? 'input-error' : ''}`}
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
                  className={`input text-xs ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                />
                {errors.password && <p className="field-error">{errors.password.message}</p>}
              </div>

              {/* Role */}
              <div>
                <label className="label">Account role</label>
                <select className="input text-xs bg-[#0c0c0e]" {...register('role')}>
                  <option value={UserRole.NORMAL_USER}>Customer (NORMAL_USER)</option>
                  <option value={UserRole.SYSTEM_ADMIN}>Administrator (SYSTEM_ADMIN)</option>
                </select>
                {errors.role && <p className="field-error">{errors.role.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full mt-2 text-xs py-2.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Creating Profile…
                  </>
                ) : (
                  'Create User Profile'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete / Reactivate Action Confirm Dialog ── */}
      {actionUserId && actionType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => {
              setActionUserId(null);
              setActionType(null);
            }}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-[#1f1f23] bg-[#0c0c0e] p-5 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${actionType === 'delete' ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'}`}
              >
                {actionType === 'delete' ? (
                  <Trash2 className="h-4 w-4" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-200">
                  {actionType === 'delete' ? 'Delete User Account' : 'Reactivate User Account'}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                  {actionType === 'delete'
                    ? 'Are you sure you want to soft-delete this user? They will be immediately signed out and barred from logging in.'
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

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setActionUserId(null);
                  setActionType(null);
                }}
                className="btn-ghost py-1.5 px-3 rounded-lg text-xs"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={submitting}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold text-white transition-all flex items-center gap-1.5 active:scale-95 ${
                  actionType === 'delete'
                    ? 'bg-red-600 hover:bg-red-550'
                    : 'bg-indigo-600 hover:bg-indigo-550'
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
