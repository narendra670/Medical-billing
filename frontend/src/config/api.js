/**
 * API base URL for axios.
 *
 * Dev: '' → Vite proxy sends /api to localhost:5500
 *
 * Prod on Vercel (recommended): '' → same-origin /api, proxied to Render via
 * vercel.json generated at build from VITE_API_URL (no browser CORS).
 *
 * Prod direct to Render: set VITE_API_DIRECT=true and VITE_API_URL on Vercel;
 * also set CORS_ORIGIN on Render to your frontend URL.
 */
export function getApiBaseUrl() {
  if (!import.meta.env.PROD) {
    return '';
  }

  const direct = import.meta.env.VITE_API_DIRECT === 'true';
  const configured = import.meta.env.VITE_API_URL?.trim();

  if (direct && configured) {
    return configured.replace(/\/$/, '');
  }

  // Default production: same-origin /api (Vercel rewrite → Render)
  return '';
}
