import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

// Assume user_id is from Telegram
const userId = '123456789'; // Replace with actual Telegram user ID

const headers = { 'user-id': userId };

export const createBooking = async (booking: any) => {
  const response = await axios.post(`${API_BASE}/bookings`, booking, { headers });
  return response.data;
};

export const getMyBookings = async () => {
  const response = await axios.get(`${API_BASE}/bookings/my`, { headers });
  return response.data;
};