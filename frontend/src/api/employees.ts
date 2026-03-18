import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || `${window.location.origin}/api`;

export const getEmployeeSlots = async (employeeId: number, serviceId: number, date: string) => {
  const response = await axios.get(`${API_BASE}/employees/${employeeId}/slots`, {
    params: { service_id: serviceId, date }
  });
  return response.data;
};

export const getEmployeeById = async (employeeId: number) => {
  const response = await axios.get(`${API_BASE}/employees/${employeeId}`);
  return response.data;
};