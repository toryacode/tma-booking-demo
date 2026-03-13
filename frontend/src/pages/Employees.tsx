import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getServiceEmployees } from '../api/services';

interface Employee {
  id: number;
  name: string;
  bio?: string;
}

const Employees = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service');
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (serviceId) {
      getServiceEmployees(parseInt(serviceId)).then(setEmployees);
    }
  }, [serviceId]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Select Employee</h1>
      <div className="grid grid-cols-1 gap-4">
        {employees.map(employee => (
          <div key={employee.id} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{employee.name}</h2>
            <p>{employee.bio}</p>
            <Link to={`/booking?service=${serviceId}&employee=${employee.id}`} className="bg-blue-500 text-white px-4 py-2 rounded mt-2 inline-block">Select</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Employees;