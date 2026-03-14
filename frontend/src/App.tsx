import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Services from './pages/Services';
import Employees from './pages/Employees';
import Booking from './pages/Booking';
import History from './pages/History';
import Success from './pages/Success';
import { loginWithTelegram, setAccessToken } from './api/auth';

function AppRouter() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const telegramUserId = params.get('telegram_user_id');

    if (telegramUserId) {
      loginWithTelegram(telegramUserId)
        .then(data => {
          setAccessToken(data.access_token);
          const u = new URL(window.location.href);
          u.searchParams.delete('telegram_user_id');
          window.history.replaceState({}, document.title, u.toString());
        })
        .catch(err => {
          console.error('Telegram login failed', err);
        });
    }
  }, [location.search]);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-3 mb-4">
        <div className="container mx-auto flex gap-3">
          <Link to="/" className="text-blue-500 hover:underline">Home</Link>
          <Link to="/services" className="text-blue-500 hover:underline">Services</Link>
          <Link to="/history" className="text-blue-500 hover:underline">History</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/success" element={<Success />} />
        <Route path="/history" element={<History />} />
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