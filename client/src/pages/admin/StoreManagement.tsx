import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Store,
  Search,
  Plus,
  ArrowUpDown,
  Star,
  Loader2,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { createStoreWithOwnerSchema, type CreateStoreWithOwnerInput } from '@store-rating/shared';

interface StoreListItem {
  id: string;
  name: string;
  email: string;
  address: string;
  ownerId: string;
  createdAt: string;
  overallRating: number | null;
}

interface StoresResponse {
  data: StoreListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function StoreManagement() {
  const [data, setData] = useState<StoresResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Query States
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);

  async function fetchStores() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder,
        ...(search && { search }),
      });
      const res = await api.get<StoresResponse>(`/admin/stores?${params.toString()}`);
      setData(res.data);
    } catch {
      setError('Failed to fetch stores list.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStores();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<CreateStoreWithOwnerInput>({
    resolver: zodResolver(createStoreWithOwnerSchema),
  });

  const onAddSubmit = async (formData: CreateStoreWithOwnerInput) => {
    try {
      await api.post('/admin/stores', formData);
      setShowAddModal(false);
      reset();
      fetchStores();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      if (errorResponse.response?.data?.message) {
        setFormError('root', { message: errorResponse.response.data.message });
      } else {
        setFormError('root', { message: 'Failed to create store and owner' });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-150 flex items-center gap-2">
            <Store className="h-5 w-5 text-indigo-400" />
            Store Management
          </h1>
          <p className="mt-0.5 text-xs text-zinc-550">
            Create stores and map their store owners together in a single workflow.
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
          Create Store
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-[#1f1f23] bg-[#0c0c0e]/30">
        <form onSubmit={handleSearchSubmit} className="flex-grow max-w-md relative">
          <input
            type="text"
            placeholder="Search stores..."
            className="input pl-9 py-2 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <button type="submit" className="hidden" />
        </form>
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
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-300">No stores registered</h3>
              <p className="text-[11px] text-zinc-550 max-w-xs mx-auto mt-1 leading-normal">
                No registered venues match your search parameters. Click &ldquo;Create Store&rdquo;
                to register a new store and owner.
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
                      Store Name <ArrowUpDown className="h-3 w-3" />
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
                    onClick={() => handleSort('overallRating')}
                  >
                    <span className="flex items-center gap-1.5">
                      Overall Rating <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    className="p-4 cursor-pointer hover:text-zinc-300 transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    <span className="flex items-center gap-1.5">
                      Registered Date <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23]/60 text-zinc-350">
                {data.data.map((store) => (
                  <tr
                    key={store.id}
                    className="hover:bg-[#18181b]/35 transition-colors duration-100"
                  >
                    <td className="p-4 font-bold text-zinc-200">{store.name}</td>
                    <td className="p-4 text-zinc-400">{store.email}</td>
                    <td className="p-4 text-zinc-500 max-w-xs truncate">{store.address}</td>
                    <td className="p-4">
                      {store.overallRating !== null ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-zinc-200 text-xs">
                            {store.overallRating}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-650 italic text-[11px]">No ratings yet</span>
                      )}
                    </td>
                    <td className="p-4 text-zinc-500">
                      {new Date(store.createdAt).toLocaleDateString()}
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
            of <span className="font-semibold text-zinc-355">{data.meta.total}</span> stores
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

      {/* ── Create Store + Owner Modal ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-[#1f1f23] bg-[#0c0c0e] p-6 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-200">Register Store & Owner</h2>
                <p className="text-[11px] text-zinc-550 mt-1">
                  Create a new storefront mapping and assign a newly registered owner.
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

            <form onSubmit={handleSubmit(onAddSubmit)} noValidate className="space-y-5">
              {errors.root && (
                <div className="alert-error" role="alert">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{errors.root.message}</span>
                </div>
              )}

              {/* ── Section 1: Store Details ── */}
              <div className="space-y-3.5">
                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider border-b border-[#1f1f23]/60 pb-1">
                  1. Store Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Store Name</label>
                    <input
                      type="text"
                      placeholder="Store front name..."
                      className={`input text-xs ${errors.store?.name ? 'input-error' : ''}`}
                      {...register('store.name')}
                    />
                    {errors.store?.name && (
                      <p className="field-error">{errors.store.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Store Email</label>
                    <input
                      type="email"
                      placeholder="cafe@stripe.com"
                      className={`input text-xs ${errors.store?.email ? 'input-error' : ''}`}
                      {...register('store.email')}
                    />
                    {errors.store?.email && (
                      <p className="field-error">{errors.store.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">Store Address</label>
                  <input
                    type="text"
                    placeholder="123 Financial Block, San Francisco, CA"
                    className={`input text-xs ${errors.store?.address ? 'input-error' : ''}`}
                    {...register('store.address')}
                  />
                  {errors.store?.address && (
                    <p className="field-error">{errors.store.address.message}</p>
                  )}
                </div>
              </div>

              {/* ── Section 2: Owner Details ── */}
              <div className="space-y-3.5">
                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider border-b border-[#1f1f23]/60 pb-1">
                  2. Owner Profile Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Owner Full Name</label>
                    <input
                      type="text"
                      placeholder="Marcus Aurelius Owner"
                      className={`input text-xs ${errors.owner?.name ? 'input-error' : ''}`}
                      {...register('owner.name')}
                    />
                    {errors.owner?.name ? (
                      <p className="field-error">{errors.owner.name.message}</p>
                    ) : (
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-650">
                        <Info className="h-3.5 w-3.5" /> Must be 12–60 characters.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label">Owner Email</label>
                    <input
                      type="email"
                      placeholder="marcus@example.com"
                      className={`input text-xs ${errors.owner?.email ? 'input-error' : ''}`}
                      {...register('owner.email')}
                    />
                    {errors.owner?.email && (
                      <p className="field-error">{errors.owner.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Owner Address</label>
                    <input
                      type="text"
                      placeholder="456 Residential Avenue, SF, CA"
                      className={`input text-xs ${errors.owner?.address ? 'input-error' : ''}`}
                      {...register('owner.address')}
                    />
                    {errors.owner?.address && (
                      <p className="field-error">{errors.owner.address.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Owner Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className={`input text-xs ${errors.owner?.password ? 'input-error' : ''}`}
                      {...register('owner.password')}
                    />
                    {errors.owner?.password && (
                      <p className="field-error">{errors.owner.password.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full mt-2 text-xs py-2.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Registering Store & Owner Profile…
                  </>
                ) : (
                  'Create Store & Owner Profile'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
