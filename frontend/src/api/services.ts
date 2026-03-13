import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const getServices = async () => {
  const response = await axios.get(`${API_BASE}/services`);
  return response.data;
};

export const getServiceEmployees = async (serviceId: number) => {
  const response = await axios.get(`${API_BASE}/services/${serviceId}/employees`);
  return response.data;
};