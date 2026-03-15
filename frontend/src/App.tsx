import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useState } from 'react';
import Home from './pages/Home';
import Services from './pages/Services';
import Employees from './pages/Employees';
import Booking from './pages/Booking';
import BookingDetails from './pages/BookingDetails';
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('tma_theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('tma_theme', theme);
  }, [theme]);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp?.ready) {
      webApp.ready();
    }

    if (webApp?.expand) {
      try {
        webApp.expand();
      } catch (err) {
        console.warn('Full-size expand failed', err);
      }
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
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="rounded-2xl bg-slate-100 p-1.5 flex items-center gap-1.5 dark:bg-slate-800/80">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition ${isActive
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/services"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition ${isActive
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`
              }
            >
              Services
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition ${isActive
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`
              }
            >
              Bookings
            </NavLink>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <NavLink to="/profile" className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1 hover:bg-slate-50 transition dark:border-slate-700 dark:hover:bg-slate-800" aria-label="Open profile">
            {avatarSrc ? (
              <img src={avatarSrc} alt={getDisplayName(currentUser)} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-semibold dark:bg-slate-200 dark:text-slate-900">{avatarFallback}</div>
            )}
            </NavLink>
          </div>
        </div>
      </nav>
      <main className="pt-4">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/bookings/:bookingId" element={<BookingDetails />} />
        <Route path="/success" element={<Success />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile user={currentUser} />} />
      </Routes>
      </main>
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