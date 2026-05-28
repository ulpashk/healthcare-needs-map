// API Configuration
// Uses Vercel proxy to avoid CORS/Private Network Access issues

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Direct URLs for local development
const DIRECT_BASE = 'https://admin.smartalmaty.kz/api/v1';

// Proxy URLs for production (Vercel)
const PROXY_BASE = '/api_proxy/v1';

export const API_BASE = isLocal ? DIRECT_BASE : PROXY_BASE;

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE}${endpoint}`;
};

export default API_BASE;
