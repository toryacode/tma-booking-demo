import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getServices } from '../api/services';

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getServices()
      .then(setServices)
      .catch(err => {
        console.error('Failed to fetch services', err);
        setError('Unable to load services, check API or network.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto p-4">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-500 hover:underline">
        ← Back
      </button>
      <h1 className="text-2xl font-bold mb-4">Services</h1>
      {loading && <p>Loading services...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && services.length === 0 && (
        <p>No services available currently.</p>
      )}
      {!loading && !error && services.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {services.map(service => (
            <div key={service.id} className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{service.name}</h2>
              <p>{service.description}</p>
              <p>Duration: {service.duration} min</p>
              <p>Price: ${service.price}</p>
              <Link to={`/employees?service=${service.id}`} className="bg-blue-500 text-white px-4 py-2 rounded mt-2 inline-block">Book</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;