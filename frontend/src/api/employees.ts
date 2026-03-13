import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const getEmployeeSlots = async (employeeId: number, serviceId: number, date: string) => {
  const response = await axios.get(`${API_BASE}/employees/${employeeId}/slots`, {
    params: { service_id: serviceId, date }
  });
  return response.data;
};