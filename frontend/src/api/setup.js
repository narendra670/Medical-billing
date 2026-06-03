import axios from 'axios';
import api from './client';

// Keep default axios in sync for any file that still imports 'axios' directly
axios.defaults.baseURL = api.defaults.baseURL ?? '';
Object.assign(axios.defaults.headers.common, api.defaults.headers.common);

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL?.trim()) {
  console.warn(
    'VITE_API_URL was empty at build time. On Vercel, set it to your Render URL and redeploy.'
  );
}

export { api };
