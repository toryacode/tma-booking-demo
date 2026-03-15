import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { getServiceEmployees } from '../api/services';
import { normalizeImageUrl } from '../utils/image';

interface Employee {
  id: number;
  name: string;
  bio?: string;
  avatar?: string;
}

const Employees = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedAvatarIds, setFailedAvatarIds] = useState<number[]>([]);

  useEffect(() => {
    if (serviceId) {
      setLoading(true);
      setFailedAvatarIds([]);
      getServiceEmployees(parseInt(serviceId))
        .then(setEmployees)
        .catch(err => {
          console.error('Failed to fetch employees', err);
          setError('Unable to load employees for selected service.');
        })
        .finally(() => setLoading(false));
    }
  }, [serviceId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-5">
          <h1 className="mb-3 text-3xl font-bold text-slate-800 dark:text-slate-100">Choose an Expert</h1>
          <button onClick={() => navigate(-1)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            ← Back
          </button>
        </div>

        {loading && <p className="rounded-3xl bg-white/80 p-6 text-center text-slate-500 shadow-lg backdrop-blur-xl dark:bg-slate-800/80 dark:text-slate-300">Loading employees...</p>}
        {error && <p className="rounded-3xl bg-rose-50 p-6 text-center text-rose-700 shadow-lg dark:bg-rose-900/30 dark:text-rose-200">{error}</p>}

        {!loading && !error && employees.length === 0 && (
          <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-600 shadow-lg dark:bg-slate-800 dark:text-slate-300">No employees found for this service.</div>
        )}

        {!loading && !error && employees.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {employees.map(employee => (
              <div key={employee.id} className="rounded-3xl bg-white p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-800">
                <div className="mb-3 flex items-center gap-3">
                  {normalizeImageUrl(employee.avatar) && !failedAvatarIds.includes(employee.id) ? (
                    <img
                      src={normalizeImageUrl(employee.avatar) || undefined}
                      alt={employee.name}
                      className="h-12 w-12 rounded-full object-cover"
                      onError={() => setFailedAvatarIds(prev => (prev.includes(employee.id) ? prev : [...prev, employee.id]))}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-semibold dark:bg-slate-700 dark:text-slate-100">
                      {employee.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{employee.name}</h2>
                </div>
                <p className="mt-2 text-slate-500 dark:text-slate-300">{employee.bio}</p>
                <Link to={`/booking?service=${serviceId}&employee=${employee.id}`} className="mt-4 inline-block w-full rounded-2xl bg-blue-600 px-4 py-2 text-center font-semibold text-white transition hover:bg-blue-700">
                  Book with {employee.name}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;