import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getMyBookings } from '../api/bookings';

interface Booking {
  id: number;
  service?: { name?: string; duration?: number; price?: number; description?: string };
  employee?: { name?: string; bio?: string; avatar?: string };
  start_time: string;
  end_time?: string;
  status: string;
}

const Home = () => {
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const loadUpcomingBooking = async () => {
      try {
        const bookings = (await getMyBookings()) as Booking[];
        const now = new Date();
        const upcoming = bookings
          .filter((booking) => {
            const start = new Date(booking.start_time);
            return start >= now && booking.status !== 'cancelled' && booking.status !== 'completed';
          })
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0] || null;

        setNextBooking(upcoming);
      } catch {
        setNextBooking(null);
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
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">Upcoming Booking</p>
              <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {nextBooking.service?.name || 'Service'} with {nextBooking.employee?.name || 'Specialist'}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{new Date(nextBooking.start_time).toLocaleString()}</p>
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