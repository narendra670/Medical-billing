import axios from 'axios';
import { getApiBaseUrl } from '../config/api';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      import.meta.env.PROD &&
      error.response?.status === 404 &&
      String(error.config?.url || '').includes('/api/')
    ) {
      console.error(
        'API 404: Set VITE_API_URL to your Render URL on Vercel and redeploy, or check Render is running.'
      );
    }
    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
