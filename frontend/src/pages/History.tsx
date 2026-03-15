import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings } from '../api/bookings';

interface Booking {
  id: number;
  service: { name: string };
  employee: { name: string };
  start_time: string;
  status: string;
}

const History = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-5">
          <h1 className="mb-3 text-3xl font-bold text-slate-800 dark:text-slate-100">My Bookings</h1>
          <button onClick={() => navigate('/')} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-slate-100">
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
            {bookings.map(booking => (
              <div key={booking.id} className="rounded-3xl bg-white p-5 shadow-lg dark:bg-slate-800">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{booking.service?.name || 'Unknown Service'}</h2>
                <p className="text-slate-500 dark:text-slate-300">with {booking.employee?.name || 'Unknown Specialist'}</p>
                <p className="mt-1 text-slate-500 dark:text-slate-300">{new Date(booking.start_time).toLocaleString()}</p>
                <span className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">{booking.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;