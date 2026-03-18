import { useState, useEffect } from 'react';
import { getEmployeeSlots } from '../api/employees';

export const useSlots = (employeeId: number, serviceId: number, date: string) => {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    if (employeeId && serviceId && date) {
      getEmployeeSlots(employeeId, serviceId, date).then(data => setSlots(data.slots));
    }
  }, [employeeId, serviceId, date]);

  return { slots };
};