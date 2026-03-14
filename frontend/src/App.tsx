import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Services from './pages/Services';
import Employees from './pages/Employees';
import Booking from './pages/Booking';
import History from './pages/History';

function App() {
  return (
    <Router>
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
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;