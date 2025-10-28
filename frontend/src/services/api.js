import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const channelsAPI = {
  list: (params) => api.get('/channels', { params }),
  get: (id) => api.get(`/channels/${id}`),
  create: (data) => api.post('/channels', data),
};

export const messagesAPI = {
  list: (channelId, params) => api.get(`/channels/${channelId}/messages`, { params }),
  create: (channelId, data) => api.post(`/channels/${channelId}/messages`, data),
};

export default api;


