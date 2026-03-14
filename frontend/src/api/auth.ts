import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || `${window.location.origin}/api`;

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
}

export const loginWithTelegram = async (telegramUserId: string) => {
  const response = await axios.post(`${API_BASE}/auth/login`, { telegram_user_id: telegramUserId });
  return response.data as LoginResponse;
};

export const setAccessToken = (token: string) => {
  localStorage.setItem('tma_access_token', token);
};

export const getAccessToken = () => {
  return localStorage.getItem('tma_access_token');
};

export const clearAccessToken = () => {
  localStorage.removeItem('tma_access_token');
};
