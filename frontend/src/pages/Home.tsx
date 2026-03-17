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

const Home = () => {
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [lastUnratedCompletedBooking, setLastUnratedCompletedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const loadUpcomingBooking = async () => {
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

        const unratedCompleted = bookings
          .filter((booking) => {
            const status = normalizeStatus(booking.status);
            return status === 'completed' && !reviewedBookingIds.has(booking.id);
          })
          .sort((a, b) => {
            const aTime = new Date(a.end_time || a.start_time).getTime();
            const bTime = new Date(b.end_time || b.start_time).getTime();
            return bTime - aTime;
          })[0] || null;

        setNextBooking(upcoming);
        setLastUnratedCompletedBooking(!upcoming ? unratedCompleted : null);
      } catch {
        setNextBooking(null);
        setLastUnratedCompletedBooking(null);
      }
    };

    void loadUpcomingBooking();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-slate-100 to-white py-8 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-slate-800/95">
          <h1 className="text-3xl font-semibold text-slate-800 mb-3 dark:text-slate-100">Beauty Salon Booking</h1>
          <p className="text-slate-500 mb-6 dark:text-slate-300">Fast and beautiful appointment experience for your clients.</p>

          {nextBooking && (
            <Link
              to={`/bookings/${nextBooking.id}`}
              state={{ booking: nextBooking }}
              className="mb-6 block rounded-2xl border border-blue-200 bg-blue-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-blue-800 dark:bg-blue-950/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">Closest Booking</p>
              <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {nextBooking.service?.name || 'Service'} with {nextBooking.employee?.name || 'Specialist'}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{new Date(nextBooking.start_time).toLocaleString()}</p>
            </Link>
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