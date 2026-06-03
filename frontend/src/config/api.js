/**
 * API base URL for axios.
 * - Dev: empty string → Vite proxy forwards /api to localhost:5500
 * - Prod + VITE_API_URL: direct calls to Render (requires CORS_ORIGIN on backend)
 * - Prod without VITE_API_URL: empty string → same-origin /api (requires vercel.json rewrites)
 */
export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return '';
}
