import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useState } from 'react';
import Home from './pages/Home';
import Services from './pages/Services';
import Employees from './pages/Employees';
import Booking from './pages/Booking';
import History from './pages/History';
import Success from './pages/Success';
import Profile from './pages/Profile';
import { clearAccessToken, getAccessToken, getCurrentUser, loginWithTelegramInitData, setAccessToken, type MeResponse } from './api/auth';

const getDisplayName = (user: MeResponse | null) => {
  if (!user) return 'Profile';
  const full = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  if (full) return full;
  if (user.username) return `@${user.username}`;
  return `User ${user.telegram_user_id}`;
};

function AppRouter() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<MeResponse | null>(null);

  useEffect(() => {
    if (window.Telegram?.WebApp?.ready) {
      window.Telegram.WebApp.ready();
    }

    const bootstrapAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        const initData = window.Telegram?.WebApp?.initData;
        if (initData) {
          try {
            const data = await loginWithTelegramInitData(initData);
            setAccessToken(data.access_token);
          } catch (err) {
            console.error('Telegram initData login failed', err);
          }
        }
      }

      const finalToken = getAccessToken();
      if (!finalToken) {
        setCurrentUser(null);
        return;
      }

      try {
        const me = await getCurrentUser();
        setCurrentUser(me);
      } catch (err) {
        console.error('Failed to get current user', err);
        clearAccessToken();
        setCurrentUser(null);
      }
    };

    void bootstrapAuth();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('telegram_user_id')) {
      const u = new URL(window.location.href);
      u.searchParams.delete('telegram_user_id');
      window.history.replaceState({}, document.title, u.toString());
    }
  }, [location.search]);

  const avatarSrc = currentUser?.photo_url;
  const avatarFallback = getDisplayName(currentUser).charAt(0).toUpperCase() || 'P';

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-3 mb-4">
        <div className="container mx-auto flex items-center justify-between gap-3">
          <div className="flex gap-3">
            <Link to="/" className="text-blue-500 hover:underline">Home</Link>
            <Link to="/services" className="text-blue-500 hover:underline">Services</Link>
            <Link to="/history" className="text-blue-500 hover:underline">History</Link>
          </div>

          <Link to="/profile" className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1 hover:bg-slate-50 transition" aria-label="Open profile">
            {avatarSrc ? (
              <img src={avatarSrc} alt={getDisplayName(currentUser)} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-semibold">{avatarFallback}</div>
            )}
          </Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/success" element={<Success />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile user={currentUser} />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
}

export default App;