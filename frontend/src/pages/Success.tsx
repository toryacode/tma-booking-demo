import { useLocation, useNavigate } from 'react-router-dom';

type BookingSuccessState = {
  booking: {
    id: number;
    service?: { name: string; duration: number; price: number };
    employee?: { name: string };
    start_time: string;
    end_time: string;
    status: string;
  };
};

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as BookingSuccessState | null;
  const booking = state?.booking;

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
        <div className="rounded-3xl bg-white p-8 shadow-lg dark:bg-slate-800">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="11" stroke="white" strokeWidth="2" fill="transparent" />
              <path d="M7.5 12.5L10.75 15.75L16.5 9.99999" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Booking Confirmed!</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-300">Your appointment has been scheduled successfully.</p>

          <div className="mt-6 space-y-3 text-slate-700 dark:text-slate-200">
            <div><strong>Service:</strong> {booking.service?.name || 'Unknown Service'}</div>
            <div><strong>Specialist:</strong> {booking.employee?.name || 'Unknown Specialist'}</div>
            <div><strong>Date:</strong> {start.toLocaleDateString()}</div>
            <div><strong>Time:</strong> {start.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - {end.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
            <div><strong>Duration:</strong> {duration} minutes</div>
            <div><strong>Total Price:</strong> ${price.toFixed(2)}</div>
            <div><strong>Status:</strong> {booking.status}</div>
          </div>

          <button onClick={() => navigate('/history')} className="mt-8 rounded-2xl bg-green-600 px-5 py-2 text-white hover:bg-green-700">
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Success;
