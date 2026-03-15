import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || `${window.location.origin}/api`;

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface MeResponse {
  telegram_user_id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export const loginWithTelegramInitData = async (initData: string) => {
  const response = await axios.post(`${API_BASE}/auth/login`, { init_data: initData });
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

export const getCurrentUser = async () => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No access token');
  }

  const response = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data as MeResponse;
};
