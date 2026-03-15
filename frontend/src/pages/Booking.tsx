import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getEmployeeSlots, createBooking } from '../api/bookings';
import { getServiceById } from '../api/services';
import { getEmployeeById } from '../api/employees';

const formatDateForInput = (dateObj: Date) => {
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
};

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
  const [autoDateLoading, setAutoDateLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [service, setService] = useState<{ duration: number; price: number; name: string } | null>(null);
  const [employee, setEmployee] = useState<{ name: string; bio?: string; avatar?: string } | null>(null);
  const todayDate = formatDateForInput(new Date());

  useEffect(() => {
    if (serviceId) {
      getServiceById(serviceId)
        .then(setService)
        .catch(err => {
          console.error('Failed to fetch service info', err);
          setError('Could not load service details.');
        });
    }
  }, [serviceId]);

  useEffect(() => {
    if (employeeId) {
      getEmployeeById(employeeId)
        .then(setEmployee)
        .catch(err => {
          console.error('Failed to fetch employee info', err);
        });
    }
  }, [employeeId]);

  useEffect(() => {
    if (!serviceId || !employeeId || date) {
      return;
    }

    let active = true;
    const findClosestDateWithSlots = async () => {
      setAutoDateLoading(true);
      setError('');

      try {
        const today = new Date();
        for (let dayOffset = 0; dayOffset < 45; dayOffset += 1) {
          const candidate = new Date(today);
          candidate.setDate(today.getDate() + dayOffset);
            const candidateDate = formatDateForInput(candidate);
          const data = await getEmployeeSlots(employeeId, serviceId, candidateDate);
          if (!active) return;

          if ((data.slots || []).length > 0) {
            setSlots(data.slots || []);
            setSelectedSlot('');
            setDate(candidateDate);
            return;
          }
        }

        setError('No available slots found for the upcoming period.');
      } catch (err) {
        if (!active) return;
        console.error('Failed to auto-select date', err);
      } finally {
        if (active) {
          setAutoDateLoading(false);
        }
      }
    };

    void findClosestDateWithSlots();

    return () => {
      active = false;
    };
  }, [serviceId, employeeId, date]);

  useEffect(() => {
    if (date) {
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
        .then(data => setSlots(data.slots || []))
        .catch(err => {
          console.error('Failed to fetch slots', err);
          setError('Unable to load available slots.');
        })
        .finally(() => setLoading(false));
    }
  }, [date, employeeId, serviceId, todayDate]);

  const formatLocalDateTime = (dateObj: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:00`;
  };

  const handleBook = async () => {
    if (!selectedSlot) {
      setError('Please select a slot before booking.');
      return;
    }

    if (!service) {
      setError('Service data is not loaded yet.');
      return;
    }

    setError('');
    setBookingLoading(true);

    const start = new Date(selectedSlot);
    const durationMinutes = service.duration;
    const end = new Date(start.getTime() + durationMinutes * 60000);

    try {
      const booking = await createBooking({
        service_id: serviceId,
        employee_id: employeeId,
        start_time: selectedSlot,
        end_time: formatLocalDateTime(end),
      });

      navigate('/success', {
        state: { booking },
      });
    } catch (error: any) {
      console.error(error);
      const backendMessage = error?.response?.data?.detail;
      setError(backendMessage ? `Booking failed: ${backendMessage}` : 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-xl px-4">
        <div className="mb-5">
          <h1 className="mb-3 text-3xl font-bold text-slate-800 dark:text-slate-100">Book Appointment</h1>
          <button onClick={() => navigate(-1)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            ← Back
          </button>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg dark:bg-slate-800">
          {employee && (
            <div className="mb-5 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Expert</p>
              <div className="mt-3 flex items-center gap-3">
                {employee.avatar ? (
                  <img src={employee.avatar} alt={employee.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-semibold dark:bg-slate-600 dark:text-slate-200">
                    {employee.name?.charAt(0).toUpperCase() || 'E'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{employee.name}</p>
                  {employee.bio && <p className="text-sm text-slate-500 dark:text-slate-300">{employee.bio}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-600 mb-2 dark:text-slate-300">Select Date</label>
            <input
              type="date"
              value={date}
              min={todayDate}
              onChange={e => {
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

          {autoDateLoading && <p className="text-slate-500 mb-3 dark:text-slate-300">Finding nearest available date...</p>}
          {loading && <p className="text-slate-500 mb-3 dark:text-slate-300">Searching slots...</p>}
          {error && <p className="text-rose-500 mb-3">{error}</p>}

          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-700 mb-3 dark:text-slate-200">Available Slots</h2>
            {slots.length === 0 && !loading ? (
              <p className="text-slate-500 dark:text-slate-300">No slots available for this date.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slots.map(slot => (
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
            onClick={handleBook}
            disabled={bookingLoading}
            className={`w-full rounded-2xl px-4 py-2 text-white font-semibold transition ${bookingLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {bookingLoading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Booking;