import { useEffect, useState } from 'react';
import {
  Store,
  Search,
  Star,
  ArrowUpDown,
  MapPin,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  User,
  CheckCircle,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { type SubmitRatingInput } from '@store-rating/shared';

interface StoreListItem {
  id: string;
  name: string;
  email: string;
  address: string;
  overallRating: number | null;
  ratingsCount: number;
  userRating: {
    value: number;
    comment: string | null;
  } | null;
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

interface StoreDetail {
  id: string;
  name: string;
  email: string;
  address: string;
  averageRating: number | null;
  totalRatings: number;
  distribution: Record<number, number>;
}

interface StoreDetailResponse {
  store: StoreDetail;
  reviews: ReviewItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function StoreDiscovery() {
  // Store list states
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStoresCount, setTotalStoresCount] = useState(0);

  // Selected store details states
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);

  // Your review submission states
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [commentText, setCommentText] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Fetch stores list
  async function fetchStores(keepSelected = false) {
    setListLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder,
        ...(search && { search }),
      });
      const res = await api.get<StoresResponse>(`/stores?${params.toString()}`);
      setStores(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalStoresCount(res.data.meta.total);

      // Auto-select first store if none selected and stores list is not empty
      if (!keepSelected && res.data.data.length > 0 && !selectedStoreId) {
        setSelectedStoreId(res.data.data[0].id);
      }
    } catch {
      setListError('Failed to load stores discovery feed.');
    } finally {
      setListLoading(false);
    }
  }

  // Fetch detailed stats and reviews for selected store
  async function fetchStoreDetails(storeId: string, pageNum: number) {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await api.get<StoreDetailResponse>(`/stores/${storeId}?page=${pageNum}&limit=5`);
      setSelectedStore(res.data.store);
      setReviews(res.data.reviews);
      setReviewsTotalPages(res.data.meta.totalPages);

      // Set user's existing review inputs if they already rated the store
      const currentStoreItem = stores.find((s) => s.id === storeId);
      if (currentStoreItem?.userRating) {
        setRatingValue(currentStoreItem.userRating.value);
        setCommentText(currentStoreItem.userRating.comment || '');
      } else {
        setRatingValue(0);
        setCommentText('');
      }
    } catch {
      setDetailError('Failed to load reviews and ratings details.');
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder]);

  useEffect(() => {
    if (selectedStoreId) {
      setReviewsPage(1);
      setRatingSuccess(false);
      setRatingError(null);
      fetchStoreDetails(selectedStoreId, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStores();
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) return;
    if (ratingValue === 0) {
      setRatingError('Please select a star rating (1 to 5) before submitting.');
      return;
    }

    setSubmittingRating(true);
    setRatingError(null);
    setRatingSuccess(false);

    try {
      const payload: SubmitRatingInput = {
        value: ratingValue,
        comment: commentText.trim() || null,
      };
      await api.post(`/stores/${selectedStoreId}/rating`, payload);
      setRatingSuccess(true);

      // Refresh both stores list and detail aggregate stats
      await fetchStores(true);
      await fetchStoreDetails(selectedStoreId, reviewsPage);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to submit your rating.';
      setRatingError(errorMsg);
    } finally {
      setSubmittingRating(false);
    }
  };

  const renderStars = (rating: number, size = 'h-3.5 w-3.5') => {
    const rounded = Math.round(rating * 2) / 2;
    return (
      <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5 stars`}>
        {[...Array(5)].map((_, i) => {
          const starVal = i + 1;
          const isFull = starVal <= rounded;
          const isHalf = !isFull && starVal - 0.5 <= rounded;
          return (
            <Star
              key={i}
              className={`${size} ${
                isFull
                  ? 'fill-amber-400 text-amber-400'
                  : isHalf
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'text-zinc-700'
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row overflow-hidden bg-zinc-950 animate-fade-in">
      {/* ── Left Pane: Stores Discovery Feed ── */}
      <div className="w-full md:w-5/12 border-r border-[#1f1f23] flex flex-col h-full bg-[#0c0c0e]/10 shrink-0">
        {/* Search and Sort Header */}
        <div className="p-4 border-b border-[#1f1f23]/60 space-y-3 bg-[#0c0c0e]/30">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search by store name or address..."
              className="input pl-9 py-2 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          </form>

          <div className="flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSortChange('name')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all text-[11px] font-semibold ${
                  sortBy === 'name'
                    ? 'bg-[#18181b] border-zinc-800 text-indigo-400'
                    : 'bg-transparent border-[#1f1f23] hover:border-zinc-800'
                }`}
              >
                Alphabetical <ArrowUpDown className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleSortChange('overallRating')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all text-[11px] font-semibold ${
                  sortBy === 'overallRating'
                    ? 'bg-[#18181b] border-zinc-800 text-indigo-400'
                    : 'bg-transparent border-[#1f1f23] hover:border-zinc-800'
                }`}
              >
                Top Rated <ArrowUpDown className="h-3 w-3" />
              </button>
            </div>
            <span className="text-[10px] text-zinc-505 font-bold">{totalStoresCount} stores</span>
          </div>
        </div>

        {/* Store List Scroll Feed */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {listLoading && stores.length === 0 ? (
            <div className="p-2 space-y-2 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-zinc-900/40 rounded-xl border border-[#1f1f23]/60"
                />
              ))}
            </div>
          ) : listError ? (
            <div className="p-8 text-center text-xs text-red-400">{listError}</div>
          ) : stores.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Store className="h-7 w-7 mx-auto text-zinc-700" />
              <div>
                <p className="text-xs font-bold text-zinc-450">No stores found</p>
                <p className="text-[11px] text-zinc-650 mt-1">Try adjusting your search criteria</p>
              </div>
            </div>
          ) : (
            stores.map((store) => (
              <div
                key={store.id}
                onClick={() => setSelectedStoreId(store.id)}
                className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between hover:bg-[#18181b]/30 ${
                  selectedStoreId === store.id
                    ? 'bg-[#18181b]/50 border-indigo-500/20 shadow-sm'
                    : 'bg-[#0c0c0e]/15 border-[#1f1f23]/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-xs text-zinc-200 truncate">{store.name}</h3>
                    {store.userRating && (
                      <span className="shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                        <CheckCircle className="h-2.5 w-2.5" /> Rated
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-550 truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0 text-zinc-600" /> {store.address}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-[#1f1f23]/30">
                  <div className="flex items-center gap-1.5">
                    {store.overallRating !== null ? (
                      <>
                        {renderStars(store.overallRating)}
                        <span className="font-bold text-zinc-300 text-[10px]">
                          {store.overallRating}
                        </span>
                      </>
                    ) : (
                      <span className="text-zinc-650 italic text-[10px]">No ratings</span>
                    )}
                  </div>
                  <span className="text-zinc-550 text-[9px] font-semibold">
                    {store.ratingsCount} reviews
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* List Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#1f1f23]/60 flex justify-between items-center text-xs bg-[#0c0c0e]/20">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="btn-ghost p-1.5 disabled:opacity-20 border border-[#1f1f23]"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-zinc-555 text-[10px]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="btn-ghost p-1.5 disabled:opacity-20 border border-[#1f1f23]"
              aria-label="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Right Pane: Store Details & Yelp-style Ratings/Reviews ── */}
      <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-y-auto">
        {selectedStoreId && selectedStore ? (
          detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-indigo-400" />
                <p className="text-xs text-zinc-550">Loading store details...</p>
              </div>
            </div>
          ) : detailError ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-2 max-w-xs">
                <div className="mx-auto h-9 w-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <ShieldAlert className="h-4.5 w-4.5" />
                </div>
                <p className="text-xs text-red-400">{detailError}</p>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#1f1f23]/60 animate-fade-in">
              {/* Reviews list and Ratings Overview Column */}
              <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-8">
                {/* Store Hero Details */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-zinc-100">
                      {selectedStore.name}
                    </h2>
                    <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-3 text-[11px] text-zinc-550">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-indigo-400" /> {selectedStore.address}
                      </span>
                      <span className="hidden sm:inline text-zinc-700">·</span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-indigo-400" /> {selectedStore.email}
                      </span>
                    </div>
                  </div>

                  {/* Rating summary layout (Yelp/Google Maps style) */}
                  <div className="grid gap-6 sm:grid-cols-2 bg-[#0c0c0e]/30 border border-[#1f1f23] p-5 rounded-xl shadow-subtle">
                    {/* Left Column: Big overall badge */}
                    <div className="flex flex-col items-center justify-center border-r-0 sm:border-r border-[#1f1f23] py-2 space-y-1.5">
                      <span className="text-4xl font-extrabold tracking-tight text-zinc-100">
                        {selectedStore.averageRating !== null ? selectedStore.averageRating : '—'}
                      </span>
                      <div className="flex flex-col items-center">
                        {renderStars(selectedStore.averageRating || 0, 'h-4 w-4')}
                        <span className="text-[10px] text-zinc-500 mt-1 font-bold">
                          Based on {selectedStore.totalRatings} reviews
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Percentage distribution histogram */}
                    <div className="flex flex-col justify-center space-y-2 py-1">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = selectedStore.distribution[stars] || 0;
                        const percentage =
                          selectedStore.totalRatings > 0
                            ? (count / selectedStore.totalRatings) * 100
                            : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2.5 text-[10px]">
                            <span className="w-9 text-zinc-550 font-bold text-right shrink-0">
                              {stars} Star
                            </span>
                            <div className="flex-1 h-1.5 rounded bg-zinc-900 overflow-hidden border border-[#1f1f23]">
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
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#1f1f23]/60 pb-2.5">
                    <MessageSquare className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-[10px] font-bold tracking-wide text-zinc-350 uppercase">
                      Customer Feedback Feed
                    </h3>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-650">
                      No customer reviews submitted yet. Be the first to review!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((review) => {
                        const initials = review.user.name
                          .split(' ')
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase();
                        return (
                          <div
                            key={review.id}
                            className="p-4 rounded-xl border border-[#1f1f23]/60 bg-[#0c0c0e]/5 space-y-2.5 hover:border-[#1f1f23] transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-zinc-900 border border-[#1f1f23] flex items-center justify-center text-[10px] font-bold text-indigo-400">
                                  {initials || <User className="h-3 w-3" />}
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-zinc-300">
                                    {review.user.name}
                                  </p>
                                  <p className="text-[9px] text-zinc-550 flex items-center gap-0.5 mt-0.5">
                                    <Calendar className="h-2.5 w-2.5" />
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="shrink-0">{renderStars(review.value)}</div>
                            </div>

                            {review.comment && (
                              <p className="text-[11px] text-zinc-400 leading-relaxed pl-0.5">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {/* Reviews Feed Pagination */}
                      {reviewsTotalPages > 1 && (
                        <div className="flex justify-end items-center gap-2 text-xs pt-3">
                          <button
                            onClick={() => {
                              const prevPage = Math.max(reviewsPage - 1, 1);
                              setReviewsPage(prevPage);
                              fetchStoreDetails(selectedStoreId, prevPage);
                            }}
                            disabled={reviewsPage === 1}
                            className="btn-ghost border border-[#1f1f23] rounded-lg p-1.5 disabled:opacity-20"
                            aria-label="Previous Reviews Page"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-zinc-550 text-[10px]">
                            Page {reviewsPage} of {reviewsTotalPages}
                          </span>
                          <button
                            onClick={() => {
                              const nextPage = Math.min(reviewsPage + 1, reviewsTotalPages);
                              setReviewsPage(nextPage);
                              fetchStoreDetails(selectedStoreId, nextPage);
                            }}
                            disabled={reviewsPage === reviewsTotalPages}
                            className="btn-ghost border border-[#1f1f23] rounded-lg p-1.5 disabled:opacity-20"
                            aria-label="Next Reviews Page"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Rating Submission Card Column */}
              <div className="w-full md:w-80 shrink-0 p-6 bg-zinc-950 flex flex-col justify-start">
                <div className="sticky top-6 border border-[#1f1f23] bg-[#0c0c0e]/10 rounded-xl p-5 space-y-5">
                  <div>
                    <h3 className="font-bold text-xs text-zinc-200">
                      {stores.find((s) => s.id === selectedStoreId)?.userRating
                        ? 'Update your review'
                        : 'Submit your rating'}
                    </h3>
                    <p className="text-[10px] text-zinc-550 mt-1 leading-normal">
                      Submit your feedback directly to help other customers.
                    </p>
                  </div>

                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    {ratingError && (
                      <div className="alert-error" role="alert">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{ratingError}</span>
                      </div>
                    )}

                    {ratingSuccess && (
                      <div className="alert-success" role="alert">
                        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Rating updated successfully!</span>
                      </div>
                    )}

                    {/* Interactive Star Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Star Rating
                      </label>
                      <div className="flex items-center gap-1.5 py-1">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onMouseEnter={() => setHoverRating(val)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRatingValue(val)}
                            className="focus:outline-none transition-all duration-100 hover:scale-115 hover:-translate-y-0.5 active:scale-95"
                            aria-label={`Select ${val} Stars`}
                          >
                            <Star
                              className={`h-6 w-6 ${
                                val <= (hoverRating || ratingValue)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-zinc-700 hover:text-zinc-650'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Optional Review Comment Textarea */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="review-comment"
                        className="text-[10px] font-bold uppercase tracking-wider text-zinc-500"
                      >
                        Written comment{' '}
                        <span className="text-[9px] text-zinc-650 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        id="review-comment"
                        rows={4}
                        placeholder="Write something about your visit..."
                        className="input py-2 text-xs bg-zinc-900 border-[#1f1f23] max-h-40 min-h-[70px]"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingRating}
                      className="btn-primary w-full py-2.5 text-xs"
                    >
                      {submittingRating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving Review…
                        </>
                      ) : stores.find((s) => s.id === selectedStoreId)?.userRating ? (
                        'Update Feedback'
                      ) : (
                        'Submit Rating'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Store className="h-6 w-6 mx-auto text-zinc-700" />
              <p className="text-xs text-zinc-500">No store selected</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
