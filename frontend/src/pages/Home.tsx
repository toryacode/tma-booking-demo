import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getMyBookings, getMyReviews } from '../api/bookings';

interface Booking {
  id: number;
  service?: { name?: string; duration?: number; price?: number; description?: string };
  employee?: { name?: string; bio?: string; avatar?: string };
  start_time: string;
  end_time?: string;
  status: string;
}

interface UserReview {
  booking_id?: number;
  booking?: { id?: number };
}

const normalizeStatus = (status: string) => status.trim().toLowerCase().replace(' ', '_');

const formatBookingDateTime = (value: string) =>
  new Date(value).toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const getDaysUntil = (value: string) => {
  const now = new Date();
  const target = new Date(value);

  const nowDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetDayStart = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const days = Math.round((targetDayStart - nowDayStart) / (1000 * 60 * 60 * 24));

  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
};

const Home = () => {
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [lastUnratedCompletedBooking, setLastUnratedCompletedBooking] = useState<Booking | null>(null);
  const [lastCompletedBooking, setLastCompletedBooking] = useState<Booking | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [heroLoading, setHeroLoading] = useState(true);

  useEffect(() => {
    const loadUpcomingBooking = async () => {
      setHeroLoading(true);
      try {
        const [bookings, reviews] = await Promise.all([
          getMyBookings() as Promise<Booking[]>,
          getMyReviews() as Promise<UserReview[]>,
        ]);
        const now = new Date();
        const upcoming = bookings
          .filter((booking) => {
            const status = normalizeStatus(booking.status);
            const start = new Date(booking.start_time).getTime();
            const isFuture = start > now.getTime();
            return isFuture && (status === 'scheduled' || status === 'upcoming' || status === 'upcomming');
          })
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0] || null;

        const reviewedBookingIds = new Set(
          (reviews || [])
            .map((review) => review.booking_id || review.booking?.id)
            .filter((id): id is number => typeof id === 'number'),
        );

        const lastCompletedBooking = bookings
          .filter((booking) => normalizeStatus(booking.status) === 'completed')
          .sort((a, b) => {
            const aTime = new Date(a.end_time || a.start_time).getTime();
            const bTime = new Date(b.end_time || b.start_time).getTime();
            return bTime - aTime;
          })[0] || null;

        const totalCompletedCount = bookings.filter((booking) => normalizeStatus(booking.status) === 'completed').length;

        const unratedLastCompleted =
          lastCompletedBooking && !reviewedBookingIds.has(lastCompletedBooking.id)
            ? lastCompletedBooking
            : null;

        setNextBooking(upcoming);
        setLastUnratedCompletedBooking(!upcoming ? unratedLastCompleted : null);
        setLastCompletedBooking(lastCompletedBooking);
        setCompletedCount(totalCompletedCount);
      } catch {
        setNextBooking(null);
        setLastUnratedCompletedBooking(null);
        setLastCompletedBooking(null);
        setCompletedCount(0);
      } finally {
        setHeroLoading(false);
      }
    };

    void loadUpcomingBooking();
  }, []);

  const hero = (() => {
    if (nextBooking) {
      return {
        eyebrow: 'Next Appointment',
        title: `${nextBooking.service?.name || 'Service'} with ${nextBooking.employee?.name || 'your specialist'}`,
        description: `Booked for ${formatBookingDateTime(nextBooking.start_time)}. We will notify you right before it starts.`,
        primaryTo: `/bookings/${nextBooking.id}`,
        primaryLabel: 'Open Booking',
        secondaryTo: '/services',
        secondaryLabel: 'Add Another Service',
        badge: getDaysUntil(nextBooking.start_time),
      };
    }

    if (lastCompletedBooking) {
      return {
        eyebrow: 'Stay In Rhythm',
        title: 'Ready for your next refresh?',
        description: `Your last visit was ${formatBookingDateTime(lastCompletedBooking.end_time || lastCompletedBooking.start_time)}${lastCompletedBooking.service?.name ? ` for ${lastCompletedBooking.service.name}` : ''}. Keep the momentum going.`,
        primaryTo: '/services',
        primaryLabel: 'Book Next Visit',
        secondaryTo: '/history',
        secondaryLabel: 'See Visit History',
        badge: `${completedCount} completed visit${completedCount === 1 ? '' : 's'}`,
      };
    }

    return {
      eyebrow: 'Welcome',
      title: 'Your beauty concierge is ready',
      description: 'Pick a service, choose your specialist, and book in under a minute.',
      primaryTo: '/services',
      primaryLabel: 'Find Services',
      secondaryTo: '/history',
      secondaryLabel: 'My Bookings',
      badge: 'Fast booking flow',
    };
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-slate-100 to-white py-8 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-slate-800/95">
          {heroLoading ? (
            <div className="mb-6 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50 p-4 dark:border-cyan-800/60 dark:from-cyan-950/40 dark:via-sky-950/30 dark:to-indigo-950/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Preparing your dashboard</p>
              <div className="mt-3 h-6 w-4/5 animate-pulse rounded bg-cyan-100/80 dark:bg-cyan-900/40" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-200/80 dark:bg-slate-700/60" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-200/80 dark:bg-slate-700/60" />
              <div className="mt-4 flex gap-2">
                <div className="h-9 w-32 animate-pulse rounded-xl bg-slate-300/80 dark:bg-slate-700/70" />
                <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800/70" />
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50 p-4 dark:border-cyan-800/60 dark:from-cyan-950/40 dark:via-sky-950/30 dark:to-indigo-950/40">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{hero.eyebrow}</p>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-cyan-800 dark:bg-slate-900/50 dark:text-cyan-200">{hero.badge}</span>
              </div>
              <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{hero.title}</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{hero.description}</p>
              <div className="mt-4 flex gap-2">
                <Link to={hero.primaryTo} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
                  {hero.primaryLabel}
                </Link>
                <Link to={hero.secondaryTo} className="rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:hover:bg-slate-900">
                  {hero.secondaryLabel}
                </Link>
              </div>
            </div>
          )}

          {!nextBooking && lastUnratedCompletedBooking && (
            <Link
              to={`/bookings/${lastUnratedCompletedBooking.id}`}
              state={{ booking: lastUnratedCompletedBooking }}
              className="mb-6 block rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-amber-800/70 dark:from-amber-950/40 dark:to-orange-950/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Rate Your Last Visit</p>
              <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                Tell us about {lastUnratedCompletedBooking.service?.name || 'your service'} with {lastUnratedCompletedBooking.employee?.name || 'your specialist'}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Your feedback helps us improve your next appointment.</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-slate-900/50 dark:text-amber-200">
                <span className="text-sm leading-none">★</span>
                Open and leave a rating
              </div>
            </Link>
          )}

          <div className="space-y-3">
            <Link to="/services" className="block rounded-2xl bg-blue-600 px-5 py-3 text-center font-medium text-white shadow-lg transition hover:bg-blue-700">
              Browse Services
            </Link>
            <Link to="/history" className="block rounded-2xl bg-slate-900 px-5 py-3 text-center font-medium text-white shadow-lg transition hover:bg-slate-800">
              My Bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;