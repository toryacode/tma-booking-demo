import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useState } from 'react';
import Home from './pages/Home';
import Services from './pages/Services';
import Employees from './pages/Employees';
import Booking from './pages/Booking';
import BookingDetails from './pages/BookingDetails';
import Reschedule from './pages/Reschedule';
import History from './pages/History';
import Success from './pages/Success';
import Profile from './pages/Profile';
import { clearAccessToken, getAccessToken, getCurrentUser, loginWithTelegramInitData, setAccessToken, type MeResponse } from './api/auth';
import { normalizeImageUrl } from './utils/image';

const getDisplayName = (user: MeResponse | null) => {
  if (!user) return 'Profile';
  const full = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  if (full) return full;
  if (user.username) return `@${user.username}`;
  return `User ${user.telegram_user_id}`;
};

const THEME_SWITCH_DURATION_MS = 540;

type ViewTransitionController = {
  finished: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (updateCallback: () => void | Promise<void>) => ViewTransitionController;
};

function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<MeResponse | null>(null);
  const [authBootstrapping, setAuthBootstrapping] = useState(true);
  const [showAuthOverlay, setShowAuthOverlay] = useState(true);
  const [authOverlayFading, setAuthOverlayFading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('tma_theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const themeSwitchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('tma_theme', theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (themeSwitchTimerRef.current !== null) {
        window.clearTimeout(themeSwitchTimerRef.current);
      }
      document.documentElement.classList.remove('theme-switching');
    };
  }, []);

  useEffect(() => {
    const scrollEditableIntoView = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const isEditable = target.matches('input, textarea, [contenteditable="true"]');
      if (!isEditable) {
        return;
      }

      target.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
    };

    const handleFocusIn = (event: FocusEvent) => {
      scrollEditableIntoView(event.target);
    };

    const handleViewportResize = () => {
      const active = document.activeElement;
      scrollEditableIntoView(active);
      window.requestAnimationFrame(() => {
        scrollEditableIntoView(active);
      });
    };

    document.addEventListener('focusin', handleFocusIn);
    window.visualViewport?.addEventListener('resize', handleViewportResize);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

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

    let cancelled = false;

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const tryTelegramLogin = async () => {
      const token = getAccessToken();
      if (token) {
        return true;
      }

      const initData = window.Telegram?.WebApp?.initData;
      if (!initData) {
        return false;
      }

      try {
        const data = await loginWithTelegramInitData(initData);
        setAccessToken(data.access_token);
        return true;
      } catch (err) {
        console.error('Telegram initData login failed', err);
        return false;
      }
    };

    const tryLoadCurrentUser = async () => {
      const token = getAccessToken();
      if (!token) {
        return false;
      }

      try {
        const me = await getCurrentUser();
        if (!cancelled) {
          setCurrentUser(me);
        }
        return true;
      } catch (err: any) {
        console.error('Failed to get current user', err);
        if (err?.response?.status === 401) {
          clearAccessToken();
        }
        return false;
      }
    };

    const bootstrapAuth = async () => {
      const MAX_ATTEMPTS = 5;
      const RETRY_DELAY_MS = 1000;

      try {
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
          if (cancelled) {
            return;
          }

          await tryTelegramLogin();
          const loaded = await tryLoadCurrentUser();
          if (loaded) {
            return;
          }

          if (attempt < MAX_ATTEMPTS - 1) {
            await wait(RETRY_DELAY_MS);
          }
        }

        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setAuthBootstrapping(false);
        }
      }
    };

    void bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('telegram_user_id')) {
      const u = new URL(window.location.href);
      u.searchParams.delete('telegram_user_id');
      window.history.replaceState({}, document.title, u.toString());
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookingId = params.get('booking_id');
    if (!bookingId) {
      return;
    }

    navigate(`/bookings/${bookingId}`, { replace: true });
  }, [location.search, navigate]);

  const avatarSrc = currentUser?.photo_url;
  const normalizedAvatarSrc = normalizeImageUrl(avatarSrc);
  const avatarFallback = getDisplayName(currentUser).charAt(0).toUpperCase() || 'P';
  const [navAvatarError, setNavAvatarError] = useState(false);

  useEffect(() => {
    setNavAvatarError(false);
  }, [normalizedAvatarSrc]);

  const handleThemeToggle = () => {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    const nextTheme: 'light' | 'dark' = theme === 'dark' ? 'light' : 'dark';

    const setNextTheme = () => {
      setTheme(nextTheme);
    };

    const transitionDoc = document as DocumentWithViewTransition;
    if (transitionDoc.startViewTransition) {
      void transitionDoc.startViewTransition(() => {
        setNextTheme();
      }).finished;
    } else {
      setNextTheme();
    }

    if (themeSwitchTimerRef.current !== null) {
      window.clearTimeout(themeSwitchTimerRef.current);
    }

    themeSwitchTimerRef.current = window.setTimeout(() => {
      root.classList.remove('theme-switching');
      themeSwitchTimerRef.current = null;
    }, THEME_SWITCH_DURATION_MS + 40);
  };

  useEffect(() => {
    if (authBootstrapping) {
      return;
    }

    setAuthOverlayFading(true);
    const timer = window.setTimeout(() => {
      setShowAuthOverlay(false);
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [authBootstrapping]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {!authBootstrapping && (
      <>
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
              onClick={handleThemeToggle}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="relative block h-4 w-4" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  className={`absolute inset-0 h-4 w-4 transform-gpu transition-all duration-500 ease-out ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-45 scale-75 opacity-0'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2.2M19.8 12H22M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
                </svg>

                <svg
                  viewBox="0 0 24 24"
                  className={`absolute inset-0 h-4 w-4 transform-gpu transition-all duration-500 ease-out ${theme === 'dark' ? 'rotate-45 scale-75 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.5 14.6A8.5 8.5 0 1 1 9.4 3.5 7 7 0 0 0 20.5 14.6Z" />
                </svg>
              </span>
            </button>

            <NavLink to="/profile" className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1 hover:bg-slate-50 transition dark:border-slate-700 dark:hover:bg-slate-800" aria-label="Open profile">
            {normalizedAvatarSrc && !navAvatarError ? (
              <img
                src={normalizedAvatarSrc}
                alt={getDisplayName(currentUser)}
                className="h-8 w-8 rounded-full object-cover"
                onError={() => setNavAvatarError(true)}
              />
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
        <Route path="/bookings/:bookingId/reschedule" element={<Reschedule />} />
        <Route path="/success" element={<Success />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile user={currentUser} />} />
      </Routes>
      </main>
      </>
      )}

      {showAuthOverlay && (
        <div
          className={`fixed inset-0 z-50 bg-gradient-to-b from-slate-100 to-white transition-opacity duration-300 dark:from-slate-950 dark:to-slate-900 ${authOverlayFading ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
          aria-live="polite"
          aria-busy="true"
        >
          <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
            <h1 className="mt-6 text-xl font-semibold text-slate-800 dark:text-slate-100">Loading your salon space</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Authorizing account and preparing your bookings...</p>
          </div>
        </div>
      )}
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