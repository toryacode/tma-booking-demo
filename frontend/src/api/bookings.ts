import axios from 'axios';
import { getAccessToken } from './auth';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || `${window.location.origin}/api`;

const getAuthHeaders = () => {
  const token = getAccessToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }

  throw new Error('Unauthorized: Telegram authentication required');
};

export const createBooking = async (booking: any) => {
  const headers = getAuthHeaders();
  const response = await axios.post(`${API_BASE}/bookings`, booking, { headers });
  return response.data;
};

export const getMyBookings = async () => {
  const headers = getAuthHeaders();
  const response = await axios.get(`${API_BASE}/bookings/my`, { headers });
  return response.data;
};

export const cancelBooking = async (bookingId: number) => {
  const headers = getAuthHeaders();
  const response = await axios.post(`${API_BASE}/bookings/${bookingId}/cancel`, {}, { headers });
  return response.data;
};

export const rescheduleBooking = async (bookingId: number, newStartTime: string, newEndTime: string) => {
  const headers = getAuthHeaders();
  const response = await axios.post(`${API_BASE}/bookings/${bookingId}/reschedule`, null, {
    headers,
    params: {
      new_start_time: newStartTime,
      new_end_time: newEndTime,
    },
  });
  return response.data;
};

export const getEmployeeSlots = async (employeeId: number, serviceId: number, date: string) => {
  const headers = getAuthHeaders();
  const response = await axios.get(`${API_BASE}/employees/${employeeId}/slots`, {
    headers,
    params: { service_id: serviceId, date },
  });
  return response.data;
};