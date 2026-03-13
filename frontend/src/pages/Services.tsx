import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getServices } from '../api/services';

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    getServices().then(setServices);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Services</h1>
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
    </div>
  );
};

export default Services;