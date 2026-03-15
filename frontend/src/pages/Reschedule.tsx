import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getEmployeeSlots, getMyBookings, rescheduleBooking } from '../api/bookings';
import { normalizeImageUrl } from '../utils/image';

interface BookingDetailsData {
  id: number;
  service_id?: number;
  service?: {
    name?: string;
    duration?: number;
    price?: number;
  };
  employee?: {
    id?: number;
    name?: string;
    bio?: string;
    avatar?: string;
  };
  employee_id?: number;
  start_time: string;
  end_time?: string;
  status: string;
}

const formatDateForInput = (dateObj: Date) => {
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
};

const formatLocalDateTime = (dateObj: Date) => {
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:00`;
};

const Reschedule = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const location = useLocation();

  const [booking, setBooking] = useState<BookingDetailsData | null>(
    (location.state as { booking?: BookingDetailsData } | null)?.booking || null,
  );
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarError, setAvatarError] = useState(false);

  const todayDate = formatDateForInput(new Date());
  const currentStart = booking ? new Date(booking.start_time) : null;

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
        console.error('Failed to load booking for reschedule', err);
        setError('Unable to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    void loadBooking();
  }, [booking, bookingId]);

  useEffect(() => {
    if (!booking) {
      return;
    }

    if (!(booking.status === 'scheduled' || booking.status === 'upcoming')) {
      setError('Only scheduled or upcoming bookings can be rescheduled.');
      return;
    }

    const startDate = new Date(booking.start_time);
    const initialDate = formatDateForInput(startDate < new Date() ? new Date() : startDate);
    setDate(initialDate);
    setSelectedSlot('');
  }, [booking]);

  const employeeId = useMemo(() => {
    if (!booking) return null;
    return booking.employee_id || booking.employee?.id || null;
  }, [booking]);

  const serviceId = useMemo(() => booking?.service_id || null, [booking]);

  useEffect(() => {
    if (!booking || !date || !employeeId || !serviceId) {
      return;
    }

    if (date < todayDate) {
      setSlots([]);
      setSelectedSlot('');
      setError('Past dates are not allowed.');
      return;
    }

    setLoading(true);
    setError('');
    setSelectedSlot('');

    getEmployeeSlots(employeeId, serviceId, date)
      .then((data) => setSlots(data.slots || []))
      .catch((err) => {
        console.error('Failed to fetch slots for reschedule', err);
        setError('Unable to load available slots.');
      })
      .finally(() => setLoading(false));
  }, [booking, date, employeeId, serviceId, todayDate]);

  const normalizedEmployeeAvatar = normalizeImageUrl(booking?.employee?.avatar);

  useEffect(() => {
    setAvatarError(false);
  }, [normalizedEmployeeAvatar]);

  const handleSave = async () => {
    if (!booking) {
      return;
    }

    if (!selectedSlot) {
      setError('Please select a new slot.');
      return;
    }

    const durationMinutes = booking.service?.duration || 0;
    if (!durationMinutes) {
      setError('Service duration is not available.');
      return;
    }

    const start = new Date(selectedSlot);
    const end = new Date(start.getTime() + durationMinutes * 60000);

    setSaving(true);
    setError('');

    try {
      const updated = await rescheduleBooking(booking.id, selectedSlot, formatLocalDateTime(end));
      navigate(`/bookings/${booking.id}`, { state: { booking: updated } });
    } catch (err: any) {
      console.error('Failed to reschedule booking', err);
      const backendMessage = err?.response?.data?.detail;
      setError(backendMessage || 'Reschedule failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-xl px-4">
        <div className="mb-5">
          <h1 className="mb-3 text-3xl font-bold text-slate-800 dark:text-slate-100">Reschedule Booking</h1>
          <button
            onClick={() => navigate(`/bookings/${bookingId || ''}`, { state: { booking } })}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ← Back
          </button>
        </div>

        {loading && !booking && (
          <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-600 shadow-lg dark:bg-slate-800 dark:text-slate-300">
            Loading booking details...
          </div>
        )}

        {booking && (
          <div className="rounded-3xl bg-white p-6 shadow-lg dark:bg-slate-800">
            <div className="mb-5 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Expert</p>
              <div className="mt-3 flex items-center gap-3">
                {normalizedEmployeeAvatar && !avatarError ? (
                  <img
                    src={normalizedEmployeeAvatar}
                    alt={booking.employee?.name || 'Expert'}
                    className="h-12 w-12 rounded-full object-cover"
                    onError={() => setAvatarError(true)}
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

            <div className="mb-5 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Current Booking</p>
              <p className="mt-2 text-slate-700 dark:text-slate-200">
                {currentStart?.toLocaleDateString()} {currentStart?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Select New Date</label>
              <input
                type="date"
                value={date}
                min={todayDate}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  if (nextDate < todayDate) {
                    setError('Past dates are not allowed.');
                    setDate(todayDate);
                    return;
                  }
                  setDate(nextDate);
                }}
                className="block w-full min-w-0 max-w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            {loading && booking && <p className="mb-3 text-slate-500 dark:text-slate-300">Searching slots...</p>}
            {error && <p className="mb-3 text-rose-500">{error}</p>}

            <div className="mb-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-700 dark:text-slate-200">Available Slots</h2>
              {slots.length === 0 && !loading ? (
                <p className="text-slate-500 dark:text-slate-300">No slots available for this date.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-xl px-3 py-2 ${selectedSlot === slot ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100'} transition`}
                    >
                      {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full rounded-2xl px-4 py-2 font-semibold text-white transition ${saving ? 'cursor-not-allowed bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {saving ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reschedule;
