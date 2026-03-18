import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getServices } from '../api/services';
import PageReveal from '../components/ui/PageReveal';

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
    console.log('Services: fetching', { apiBase: (window.location.origin + '/api') });
    getServices()
      .then(data => {
        console.log('Services: response', data);
        setServices(data);
      })
      .catch(err => {
        console.error('Failed to fetch services', err);
        setError('Unable to load services. Please check API path and network (open devtools console).');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-3xl px-4">
        <PageReveal delay={0}>
          <div className="mb-5">
            <h1 className="mb-3 text-3xl font-bold text-slate-800 dark:text-slate-100">Services</h1>
            <button onClick={() => navigate(-1)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              ← Back
            </button>
          </div>
        </PageReveal>

        {loading ? (
          <PageReveal delay={90}>
            <div className="rounded-3xl bg-white/80 p-6 text-center text-slate-500 shadow-lg backdrop-blur-xl dark:bg-slate-800/80 dark:text-slate-300">Loading services...</div>
          </PageReveal>
        ) : error ? (
          <PageReveal delay={90}>
            <div className="rounded-3xl bg-rose-50 p-6 text-center text-rose-700 shadow-lg dark:bg-rose-900/30 dark:text-rose-200">{error}</div>
          </PageReveal>
        ) : services.length === 0 ? (
          <PageReveal delay={90}>
            <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-600 shadow-lg dark:bg-slate-800 dark:text-slate-300">No services available currently.</div>
          </PageReveal>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map(service => (
              <PageReveal key={service.id} delay={90 + Math.min(service.id, 8) * 55}>
                <div className="rounded-3xl bg-white p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-800">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{service.name}</h2>
                  <p className="mt-2 text-slate-500 dark:text-slate-300">{service.description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>{service.duration} min</span>
                    <span>${service.price.toFixed(2)}</span>
                  </div>
                  <Link to={`/employees?service=${service.id}`} className="mt-4 inline-block w-full rounded-2xl bg-blue-600 px-4 py-2 text-center font-semibold text-white transition hover:bg-blue-700">
                    Book this service
                  </Link>
                </div>
              </PageReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;