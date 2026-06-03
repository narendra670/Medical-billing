import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_RENDER_URL = 'https://medical-billing-vmji.onrender.com';

function loadDotEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const vars = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const envProduction = loadDotEnvFile(join(root, '.env.production'));

const apiUrl = (
  process.env.VITE_API_URL ||
  envProduction.VITE_API_URL ||
  DEFAULT_RENDER_URL
)
  .trim()
  .replace(/\/$/, '');

const rewrites = [
  {
    source: '/api/:path*',
    destination: `${apiUrl}/api/:path*`,
  },
  {
    source: '/((?!api/).*)',
    destination: '/index.html',
  },
];

writeFileSync(join(root, 'vercel.json'), JSON.stringify({ rewrites }, null, 2) + '\n');
console.log(`[vercel] Proxy /api/* → ${apiUrl}/api/*`);
