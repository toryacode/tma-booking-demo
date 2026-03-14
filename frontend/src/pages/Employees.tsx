import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { getServiceEmployees } from '../api/services';

interface Employee {
  id: number;
  name: string;
  bio?: string;
}

const Employees = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (serviceId) {
      setLoading(true);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-slate-100">
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Choose an Expert</h1>
        </div>

        {loading && <p className="rounded-3xl bg-white/80 p-6 text-center text-slate-500 shadow-lg backdrop-blur-xl">Loading employees...</p>}
        {error && <p className="rounded-3xl bg-rose-50 p-6 text-center text-rose-700 shadow-lg">{error}</p>}

        {!loading && !error && employees.length === 0 && (
          <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-600 shadow-lg">No employees found for this service.</div>
        )}

        {!loading && !error && employees.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {employees.map(employee => (
              <div key={employee.id} className="rounded-3xl bg-white p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl">
                <h2 className="text-xl font-semibold text-slate-800">{employee.name}</h2>
                <p className="mt-2 text-slate-500">{employee.bio}</p>
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