import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getEmployeeSlots, createBooking } from '../api/bookings';

const Booking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceId = parseInt(searchParams.get('service') || '0');
  const employeeId = parseInt(searchParams.get('employee') || '0');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (date) {
      setLoading(true);
      setError('');
      getEmployeeSlots(employeeId, serviceId, date)
        .then(data => setSlots(data.slots || []))
        .catch(err => {
          console.error('Failed to fetch slots', err);
          setError('Unable to load available slots.');
        })
        .finally(() => setLoading(false));
    }
  }, [date, employeeId, serviceId]);

  const handleBook = async () => {
    if (!selectedSlot) {
      setError('Please select a slot before booking.');
      return;
    }
    setError('');
    const startTime = new Date(selectedSlot);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    try {
      await createBooking({ service_id: serviceId, employee_id: employeeId, start_time: startTime.toISOString(), end_time: endTime.toISOString() });
      alert('Booking created!');
      navigate('/history');
    } catch (error: any) {
      console.error(error);
      const backendMessage = error?.response?.data?.detail;
      setError(backendMessage ? `Booking failed: ${backendMessage}` : 'Booking failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="mx-auto max-w-xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-slate-100">
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Book Appointment</h1>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-600 mb-2">Select Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500" />
          </div>

          {loading && <p className="text-slate-500 mb-3">Searching slots...</p>}
          {error && <p className="text-rose-500 mb-3">{error}</p>}

          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Available Slots</h2>
            {slots.length === 0 && !loading ? (
              <p className="text-slate-500">No slots available for this date.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl px-3 py-2 ${selectedSlot === slot ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'} transition`}
                  >
                    {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleBook} className="w-full rounded-2xl bg-blue-600 px-4 py-2 text-white font-semibold transition hover:bg-blue-700">
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default Booking;