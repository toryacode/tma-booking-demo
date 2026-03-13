import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Beauty Salon Booking</h1>
      <div className="space-y-4">
        <Link to="/services" className="block bg-blue-500 text-white p-4 rounded">Browse Services</Link>
        <Link to="/history" className="block bg-green-500 text-white p-4 rounded">My Bookings</Link>
      </div>
    </div>
  );
};

export default Home;