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
    <div className="container mx-auto p-4">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-500 hover:underline">
        ← Back
      </button>
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>
      {loading && <p>Loading bookings...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && bookings.length === 0 && <p>No bookings yet.</p>}
      {!loading && !error && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white p-4 rounded shadow">
              <h2>{booking.service.name} with {booking.employee.name}</h2>
              <p>{new Date(booking.start_time).toLocaleString()}</p>
              <p>Status: {booking.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;