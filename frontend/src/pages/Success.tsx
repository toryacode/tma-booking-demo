import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { normalizeImageUrl } from '../utils/image';
import { cancelBooking, downloadBookingCalendar } from '../api/bookings';
import BookingStatusChip from '../components/booking/BookingStatusChip';

type BookingSuccessState = {
  booking: {
    id: number;
    service?: { name?: string; duration?: number; price?: number; description?: string };
    employee?: { name?: string; bio?: string; avatar?: string };
    start_time: string;
    end_time: string;
    status: string;
  };
};

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as BookingSuccessState | null;
  const [booking, setBooking] = useState(state?.booking ?? null);
  const normalizedEmployeeAvatar = normalizeImageUrl(booking?.employee?.avatar);
  const [employeeAvatarError, setEmployeeAvatarError] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState('');

  useEffect(() => {
    setEmployeeAvatarError(false);
  }, [normalizedEmployeeAvatar]);

  const canCancel = booking?.status === 'scheduled' || booking?.status === 'upcoming';

  const handleCancel = async () => {
    if (!booking || !canCancel) {
      return;
    }

    setCancelError('');
    setCancelLoading(true);
    try {
      const updated = await cancelBooking(booking.id);
      setBooking(updated);
      setConfirmCancelOpen(false);
    } catch (err: any) {
      console.error('Failed to cancel booking from success page', err);
      const backendMessage = err?.response?.data?.detail;
      setCancelError(backendMessage || 'Failed to cancel booking.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!booking) {
      return;
    }

    setCalendarLoading(true);
    setCalendarError('');
    try {
      await downloadBookingCalendar(booking.id);
    } catch (err) {
      console.error('Failed to download booking calendar from success page', err);
      setCalendarError('Failed to download calendar file.');
    } finally {
      setCalendarLoading(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 dark:from-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">No booking data</h1>
          <p className="mt-4 text-slate-500 dark:text-slate-300">Please make a booking first.</p>
          <button onClick={() => navigate('/services')} className="mt-5 rounded-2xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">
            Go to Services
          </button>
        </div>
      </div>
    );
  }

  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const duration = booking.service?.duration ?? Math.round((end.getTime() - start.getTime()) / 60000);
  const price = booking.service?.price ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-5">
          <h1 className="mb-3 text-3xl font-bold text-slate-800 dark:text-slate-100">Booking Confirmed!</h1>
          <button
            onClick={() => navigate('/history')}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ← Back
          </button>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg dark:bg-slate-800">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-600">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="11" stroke="white" strokeWidth="2" fill="transparent" />
              <path d="M7.5 12.5L10.75 15.75L16.5 9.99999" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{booking.service?.name || 'Service'}</p>
                <BookingStatusChip status={booking.status} />
              </div>
              <p className="text-slate-500 dark:text-slate-300">
                {booking.status === 'cancelled' || booking.status === 'canceled'
                  ? 'This appointment was cancelled.'
                  : 'Your appointment has been scheduled successfully.'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Expert</p>
              <div className="mt-3 flex items-center gap-3">
                {normalizedEmployeeAvatar && !employeeAvatarError ? (
                  <img
                    src={normalizedEmployeeAvatar}
                    alt={booking.employee?.name || 'Expert'}
                    className="h-12 w-12 rounded-full object-cover"
                    onError={() => setEmployeeAvatarError(true)}
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

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Schedule</p>
              <p className="mt-3 text-slate-800 dark:text-slate-100">{start.toLocaleDateString()}</p>
              <p className="text-slate-600 dark:text-slate-300">
                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Duration: <span className="font-semibold text-slate-800 dark:text-slate-100">{duration} min</span>
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Full Price: <span className="font-semibold text-slate-800 dark:text-slate-100">${price.toFixed(2)}</span>
            </p>
          </div>

          {cancelError && <p className="mt-4 text-rose-500">{cancelError}</p>}
          {calendarError && <p className="mt-4 text-rose-500">{calendarError}</p>}

          <div className="mt-6 flex flex-wrap gap-2">
            {booking.status !== 'cancelled' && booking.status !== 'canceled' && (
              <button
                onClick={handleAddToCalendar}
                disabled={calendarLoading}
                className={`rounded-2xl px-5 py-2 text-white ${calendarLoading ? 'cursor-not-allowed bg-slate-400' : 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500'}`}
              >
                {calendarLoading ? 'Preparing...' : 'Add to Calendar'}
              </button>
            )}

            <button
              onClick={() => navigate('/history')}
              className="rounded-2xl bg-green-600 px-5 py-2 text-white hover:bg-green-700"
            >
              View My Bookings
            </button>

            {canCancel && !confirmCancelOpen && (
              <button
                onClick={() => setConfirmCancelOpen(true)}
                disabled={cancelLoading}
                className={`rounded-2xl px-5 py-2 text-white ${cancelLoading ? 'cursor-not-allowed bg-rose-400' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                Cancel Booking
              </button>
            )}
          </div>

          {confirmCancelOpen && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-900/20">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">Are you sure you want to cancel this booking?</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${cancelLoading ? 'bg-rose-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  {cancelLoading ? 'Cancelling...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setConfirmCancelOpen(false);
                    setCancelError('');
                  }}
                  disabled={cancelLoading}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Success;
