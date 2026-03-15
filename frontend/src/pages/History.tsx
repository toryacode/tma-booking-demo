import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyBookings } from '../api/bookings';

interface Booking {
  id: number;
  service?: { name?: string; duration?: number; price?: number; description?: string };
  employee?: { name?: string; bio?: string; avatar?: string };
  start_time: string;
  end_time?: string;
  status: string;
}

interface BookingSection {
  key: 'scheduled' | 'completed' | 'canceled';
  title: string;
  bookings: Booking[];
}

const ACTIVE_STATUSES = ['scheduled', 'upcoming', 'in_progress'];

const History = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSections, setOpenSections] = useState<Record<BookingSection['key'], boolean>>({
    scheduled: true,
    completed: false,
    canceled: false,
  });

  useEffect(() => {
    setLoading(true);
    getMyBookings()
      .then(setBookings)
      .catch(err => {
        console.error('Failed to fetch bookings', err);
        setError('Unable to load bookings, check API or network.');
      })
      .finally(() => setLoading(false));
  }, []);

  const sortedBookings = [...bookings].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const sections: BookingSection[] = [
    {
      key: 'scheduled',
      title: 'Scheduled & Upcoming',
      bookings: sortedBookings.filter(booking => ACTIVE_STATUSES.includes(booking.status.toLowerCase())),
    },
    {
      key: 'completed',
      title: 'Completed',
      bookings: sortedBookings.filter(booking => booking.status.toLowerCase() === 'completed'),
    },
    {
      key: 'canceled',
      title: 'Canceled',
      bookings: sortedBookings.filter(booking => booking.status.toLowerCase() === 'cancelled' || booking.status.toLowerCase() === 'canceled'),
    },
  ];

  const toggleSection = (sectionKey: BookingSection['key']) => {
    setOpenSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-5">
          <h1 className="mb-3 text-3xl font-bold text-slate-800 dark:text-slate-100">My Bookings</h1>
          <button onClick={() => navigate('/')} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            ← Back
          </button>
        </div>

        {loading && <p className="rounded-3xl bg-white/80 p-6 text-center text-slate-500 shadow-lg dark:bg-slate-800/80 dark:text-slate-300">Loading bookings...</p>}
        {error && <p className="rounded-3xl bg-rose-50 p-6 text-center text-rose-700 shadow-lg dark:bg-rose-900/30 dark:text-rose-200">{error}</p>}

        {!loading && !error && bookings.length === 0 && (
          <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-600 shadow-lg dark:bg-slate-800 dark:text-slate-300">No bookings yet. Book your first service today!</div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            {sections.map(section => (
              <div key={section.key} className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800/95">
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="flex w-full items-center justify-between rounded-2xl px-2 py-1 text-left"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{section.title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{section.bookings.length} booking{section.bookings.length === 1 ? '' : 's'}</p>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                    <svg
                      className={`h-4 w-4 transition-transform ${openSections[section.key] ? 'rotate-180' : 'rotate-0'}`}
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>

                {openSections[section.key] && (
                  <div className="mt-3 space-y-3">
                    {section.bookings.length === 0 && (
                      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-300">
                        No bookings in this section.
                      </p>
                    )}

                    {section.bookings.map(booking => (
                      <Link
                        key={booking.id}
                        to={`/bookings/${booking.id}`}
                        state={{ booking }}
                        className="block rounded-3xl bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-700/60"
                      >
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{booking.service?.name || 'Unknown Service'}</h3>
                        <p className="text-slate-500 dark:text-slate-300">with {booking.employee?.name || 'Unknown Specialist'}</p>
                        <p className="mt-1 text-slate-500 dark:text-slate-300">{new Date(booking.start_time).toLocaleString()}</p>
                        <span className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                          {booking.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;