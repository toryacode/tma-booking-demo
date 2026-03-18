import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { cancelBooking, getBookingReview, getMyBookings, submitBookingReview } from '../api/bookings';
import BookingStatusChip from '../components/booking/BookingStatusChip';
import { normalizeImageUrl } from '../utils/image';

interface BookingDetailsData {
  id: number;
  service?: {
    name?: string;
    duration?: number;
    price?: number;
    description?: string;
  };
  employee?: {
    name?: string;
    bio?: string;
    avatar?: string;
  };
  start_time: string;
  end_time?: string;
  status: string;
  original_price?: number;
  final_price?: number;
  discount_percent?: number;
  is_loyalty_discount?: boolean;
}

interface BookingReviewData {
  id: number;
  booking_id: number;
  user_id: string;
  rating: number;
  review?: string | null;
  review_date: string;
}

const normalizeStatus = (status: string) => status.trim().toLowerCase().replace(' ', '_');

const BookingDetails = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState<BookingDetailsData | null>(
    (location.state as { booking?: BookingDetailsData } | null)?.booking || null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [employeeAvatarError, setEmployeeAvatarError] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [existingReview, setExistingReview] = useState<BookingReviewData | null>(null);
  const [reviewEditing, setReviewEditing] = useState(false);
  const [reviewFieldFocused, setReviewFieldFocused] = useState(false);
  const reviewTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (booking) {
      return;
    }

    const id = Number(bookingId);
    if (!id) {
      setError('Booking not found.');
      return;
    }

    const loadBooking = async () => {
      setLoading(true);
      setError('');
      try {
        const bookings = (await getMyBookings()) as BookingDetailsData[];
        const found = bookings.find((item) => item.id === id) || null;
        if (!found) {
          setError('Booking not found.');
          return;
        }
        setBooking(found);
      } catch (err) {
        console.error('Failed to load booking details', err);
        setError('Unable to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    void loadBooking();
  }, [booking, bookingId]);

  const normalizedBookingStatus = booking ? normalizeStatus(booking.status) : '';

  useEffect(() => {
    if (!booking || normalizedBookingStatus !== 'completed') {
      return;
    }

    const loadReview = async () => {
      try {
        const data = (await getBookingReview(booking.id)) as BookingReviewData;
        setExistingReview(data);
        setSelectedRating(data.rating);
        setReviewText(data.review || '');
        setReviewEditing(false);
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          console.error('Failed to load booking review', err);
        }
      }
    };

    void loadReview();
  }, [booking, normalizedBookingStatus]);

  const start = booking ? new Date(booking.start_time) : null;
  const end = booking?.end_time ? new Date(booking.end_time) : null;
  const canCancel = normalizedBookingStatus === 'scheduled' || normalizedBookingStatus === 'upcoming' || normalizedBookingStatus === 'upcomming';
  const canReschedule = canCancel;
  const normalizedEmployeeAvatar = normalizeImageUrl(booking?.employee?.avatar);

  useEffect(() => {
    setEmployeeAvatarError(false);
  }, [normalizedEmployeeAvatar]);

  const handleConfirmCancel = async () => {
    if (!booking) return;

    setCancelLoading(true);
    setCancelError('');
    try {
      const updated = await cancelBooking(booking.id);
      setBooking(updated);
      setConfirmCancelOpen(false);
    } catch (err: any) {
      console.error('Failed to cancel booking', err);
      const backendMessage = err?.response?.data?.detail;
      setCancelError(backendMessage || 'Failed to cancel booking.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!booking || normalizedBookingStatus !== 'completed') {
      return;
    }
    if (selectedRating < 1 || selectedRating > 5) {
      setReviewError('Please choose a rating from 1 to 5 stars.');
      return;
    }

    setReviewSaving(true);
    setReviewError('');
    try {
      const data = (await submitBookingReview(booking.id, selectedRating, reviewText.trim())) as BookingReviewData;
      setExistingReview(data);
      setReviewText(data.review || '');
      setReviewEditing(false);
    } catch (err: any) {
      console.error('Failed to submit booking review', err);
      const backendMessage = err?.response?.data?.detail;
      setReviewError(backendMessage || 'Failed to save review.');
    } finally {
      setReviewSaving(false);
    }
  };

  const reviewPostedDate = existingReview
    ? new Date(existingReview.review_date).toLocaleDateString()
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-5">
          <h1 className="mb-3 text-3xl font-bold text-slate-800 dark:text-slate-100">Booking Details</h1>
          <button
            onClick={() => navigate('/history')}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ← Back
          </button>
        </div>

        {loading && (
          <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-600 shadow-lg dark:bg-slate-800 dark:text-slate-300">
            Loading booking details...
          </div>
        )}

        {error && (
          <div className="rounded-3xl bg-rose-50 p-6 text-center text-rose-700 shadow-lg dark:bg-rose-900/30 dark:text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && booking && (
          <div className="rounded-3xl bg-white p-6 shadow-lg dark:bg-slate-800">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                {booking.service?.name || 'Service'}
              </h2>
              <BookingStatusChip status={booking.status} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Expert</p>
                <div className="mt-3 flex items-center gap-3">
                  {normalizedEmployeeAvatar && !employeeAvatarError ? (
                    <img
                      src={normalizedEmployeeAvatar}
                      alt={booking.employee?.name || 'Expert'}
                      className="h-12 w-12 rounded-full object-cover"
                      onError={() => setEmployeeAvatarError(true)}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-semibold dark:bg-slate-600 dark:text-slate-200">
                      {(booking.employee?.name || 'E').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{booking.employee?.name || 'Specialist'}</p>
                    {booking.employee?.bio && <p className="text-sm text-slate-500 dark:text-slate-300">{booking.employee.bio}</p>}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Schedule</p>
                {start && <p className="mt-3 text-slate-800 dark:text-slate-100">{start.toLocaleDateString()}</p>}
                {start && (
                  <p className="text-slate-600 dark:text-slate-300">
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {end ? ` - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Duration</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{booking.service?.duration || 0} min</span>
              </div>
              {booking.discount_percent && booking.discount_percent > 0 ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Full price</span>
                    <span className="text-slate-400 line-through dark:text-slate-500">${(booking.original_price ?? booking.service?.price ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Discount</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{booking.discount_percent}% loyalty discount</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm dark:border-slate-600">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Total</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">${(booking.final_price ?? booking.service?.price ?? 0).toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Price</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">${(booking.final_price ?? booking.service?.price ?? 0).toFixed(2)}</span>
                </div>
              )}
            </div>

            {cancelError && (
              <p className="mt-4 text-rose-500">{cancelError}</p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {canReschedule && !confirmCancelOpen && (
                <button
                  onClick={() => navigate(`/bookings/${booking.id}/reschedule`, { state: { booking } })}
                  className="rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Reschedule
                </button>
              )}

              {canCancel && !confirmCancelOpen && (
                <button
                  onClick={() => setConfirmCancelOpen(true)}
                  className="rounded-2xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  Cancel Booking
                </button>
              )}
            </div>

            {confirmCancelOpen && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-900/20">
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">Are you sure you want to cancel this booking?</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleConfirmCancel}
                    disabled={cancelLoading}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${cancelLoading ? 'bg-rose-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}`}
                  >
                    {cancelLoading ? 'Cancelling...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => {
                      setConfirmCancelOpen(false);
                      setCancelError('');
                    }}
                    disabled={cancelLoading}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {normalizedBookingStatus === 'completed' && (
              <div className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{existingReview ? 'Your review' : 'Rate your visit'}</p>
                <div className="mt-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        if (existingReview && !reviewEditing) {
                          return;
                        }
                        setSelectedRating(star);
                        setReviewError('');
                      }}
                      className="text-2xl leading-none"
                      aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                    >
                      <span className={selectedRating >= star ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}>★</span>
                    </button>
                  ))}
                  {existingReview && !reviewEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewEditing(true);
                        setReviewError('');
                      }}
                      aria-label="Edit review"
                      className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                        <path d="M13.9 3.6a1.5 1.5 0 0 1 2.1 2.1l-8.3 8.3-3 0.9 0.9-3 8.3-8.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>

                {existingReview && !reviewEditing && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                    {existingReview.review && (
                      <p className="text-sm text-slate-700 dark:text-slate-200">{existingReview.review}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Posted on: {reviewPostedDate}</p>
                  </div>
                )}

                {selectedRating > 0 && (!existingReview || reviewEditing) && (
                  <div className="mt-4">
                    <textarea
                      ref={reviewTextareaRef}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      onFocus={() => setReviewFieldFocused(true)}
                      onBlur={() => setReviewFieldFocused(false)}
                      rows={3}
                      placeholder="Optional: share your experience"
                      enterKeyHint="done"
                      autoCapitalize="sentences"
                      style={{ scrollMarginBottom: '45vh' }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    />
                    {reviewFieldFocused && (
                      <button
                        type="button"
                        onClick={() => reviewTextareaRef.current?.blur()}
                        className="mt-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Done
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSubmitReview}
                      disabled={reviewSaving}
                      className={`mt-3 rounded-xl px-4 py-2 text-sm font-semibold text-white ${reviewSaving ? 'cursor-not-allowed bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {reviewSaving ? 'Saving...' : existingReview ? 'Update Rating' : 'Confirm Rating'}
                    </button>
                    {existingReview && (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewEditing(false);
                          setSelectedRating(existingReview.rating);
                          setReviewText(existingReview.review || '');
                          setReviewError('');
                        }}
                        disabled={reviewSaving}
                        className="ml-2 mt-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}

                {reviewError && <p className="mt-3 text-sm text-rose-500">{reviewError}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetails;
