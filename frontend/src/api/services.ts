import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export const getServices = async () => {
  const response = await axios.get(`${API_BASE}/services`);
  return response.data;
};

export const getServiceEmployees = async (serviceId: number) => {
  const response = await axios.get(`${API_BASE}/services/${serviceId}/employees`);
  return response.data;
};