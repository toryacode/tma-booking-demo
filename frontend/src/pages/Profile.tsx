import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { MeResponse } from '../api/auth';
import { getMyReviews } from '../api/bookings';
import PageReveal from '../components/ui/PageReveal';
import { normalizeImageUrl } from '../utils/image';

interface ProfileProps {
  user: MeResponse | null;
}

interface ReviewListItem {
  id: number;
  rating: number;
  review?: string | null;
  review_date: string;
  booking: {
    id: number;
    start_time: string;
    service?: { name?: string };
    employee?: { name?: string };
  };
}

const getDisplayName = (user: MeResponse | null) => {
  if (!user) return 'Guest';
  const full = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  if (full) return full;
  if (user.username) return `@${user.username}`;
  return `User ${user.telegram_user_id}`;
};

const getInitial = (user: MeResponse | null) => {
  const name = getDisplayName(user);
  return name.charAt(0).toUpperCase() || 'U';
};

const REVIEWS_PANEL_DURATION_MS = 420;

const Profile = ({ user }: ProfileProps) => {
  const navigate = useNavigate();
  const displayName = getDisplayName(user);
  const avatarSrc = normalizeImageUrl(user?.photo_url);
  const [avatarError, setAvatarError] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewsContentVisible, setReviewsContentVisible] = useState(false);
  const [reviewsPanelHeight, setReviewsPanelHeight] = useState(0);
  const reviewsContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarSrc]);

  useEffect(() => {
    if (!user) {
      setReviews([]);
      return;
    }

    setReviewsLoading(true);
    setReviewsError('');
    getMyReviews()
      .then((data) => setReviews(data as ReviewListItem[]))
      .catch((err) => {
        console.error('Failed to load reviews', err);
        setReviewsError('Unable to load your reviews.');
      })
      .finally(() => setReviewsLoading(false));
  }, [user]);

  useLayoutEffect(() => {
    const nextHeight = reviewsOpen ? (reviewsContentRef.current?.offsetHeight ?? 0) : 0;
    setReviewsPanelHeight(nextHeight);
  }, [reviewsOpen, reviews, reviewsLoading, reviewsError]);

  useEffect(() => {
    if (!reviewsOpen) {
      setReviewsContentVisible(false);
      return;
    }

    let timerId: number | null = null;
    const frameId = window.requestAnimationFrame(() => {
      timerId = window.setTimeout(() => {
        setReviewsContentVisible(true);
      }, 90);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [reviewsOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-3xl px-4">
        <PageReveal delay={0}>
          <div className="mb-5">
            <h1 className="mb-3 text-3xl font-bold text-slate-800 dark:text-slate-100">Profile</h1>
            <button
              onClick={() => navigate(-1)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              ← Back
            </button>
          </div>
        </PageReveal>

        <PageReveal delay={90}>
          <div className="rounded-3xl bg-white p-8 shadow-lg text-center dark:bg-slate-800">
            {avatarSrc && !avatarError ? (
              <img
                src={avatarSrc}
                alt={displayName}
                className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-slate-100"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="mx-auto h-28 w-28 rounded-full bg-slate-800 text-white text-4xl font-bold flex items-center justify-center dark:bg-slate-200 dark:text-slate-900">
                {getInitial(user)}
              </div>
            )}

            <h2 className="mt-6 text-2xl font-semibold text-slate-800 dark:text-slate-100">{displayName}</h2>
            {user?.username && <p className="mt-2 text-slate-500 dark:text-slate-300">@{user.username}</p>}
          </div>
        </PageReveal>

        <PageReveal delay={160}>
          <div className="mt-5 rounded-3xl bg-white p-5 shadow-lg dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setReviewsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl px-1 py-1 text-left"
            >
              <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Your Reviews</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">{reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                <svg
                  className={`h-4 w-4 transition-transform ${reviewsOpen ? 'rotate-180' : 'rotate-0'}`}
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            <div
              className="overflow-hidden transition-[height,opacity,margin] ease-out"
              style={{
                height: `${reviewsPanelHeight}px`,
                opacity: reviewsOpen ? 1 : 0,
                marginTop: reviewsOpen ? '16px' : '0px',
                transitionDuration: `${REVIEWS_PANEL_DURATION_MS}ms`,
              }}
              aria-hidden={!reviewsOpen}
            >
              <div ref={reviewsContentRef} className="space-y-3">
                {reviewsLoading && (
                  <p
                    className={`rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 transition-all ease-out dark:bg-slate-700/50 dark:text-slate-300 ${reviewsContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
                    style={{ transitionDuration: `${REVIEWS_PANEL_DURATION_MS}ms`, transitionDelay: '60ms' }}
                  >
                    Loading reviews...
                  </p>
                )}

                {reviewsError && (
                  <p
                    className={`rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 transition-all ease-out dark:bg-rose-900/30 dark:text-rose-200 ${reviewsContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
                    style={{ transitionDuration: `${REVIEWS_PANEL_DURATION_MS}ms`, transitionDelay: '60ms' }}
                  >
                    {reviewsError}
                  </p>
                )}

                {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                  <p
                    className={`rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 transition-all ease-out dark:bg-slate-700/50 dark:text-slate-300 ${reviewsContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
                    style={{ transitionDuration: `${REVIEWS_PANEL_DURATION_MS}ms`, transitionDelay: '60ms' }}
                  >
                    No reviews yet.
                  </p>
                )}

                {!reviewsLoading && !reviewsError && reviews.map((item, index) => {
                  const visitDate = new Date(item.booking.start_time);
                  const postedDate = new Date(item.review_date);

                  return (
                    <Link
                      key={item.id}
                      to={`/bookings/${item.booking.id}`}
                      className={`block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50 ${reviewsContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
                      style={{
                        transitionProperty: 'opacity, transform, box-shadow',
                        transitionDuration: `${REVIEWS_PANEL_DURATION_MS}ms`,
                        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                        transitionDelay: `${80 + Math.min(index, 6) * 70}ms`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                            {(item.booking.service?.name || 'Service')} with {(item.booking.employee?.name || 'Specialist')}
                          </h3>
                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            Visit date: {visitDate.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={item.rating >= star ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}>★</span>
                          ))}
                        </div>
                      </div>

                      {item.review && (
                        <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{item.review}</p>
                      )}

                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Posted on: {postedDate.toLocaleDateString()}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </PageReveal>
      </div>
    </div>
  );
};

export default Profile;
