import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-slate-100 to-white py-8">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-slate-800 mb-3">Beauty Salon Booking</h1>
          <p className="text-slate-500 mb-6">Fast and beautiful appointment experience for your clients.</p>
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