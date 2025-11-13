import axios from 'axios';

// Prefer Vite dev proxy, but fall back to direct backend URL in dev if needed
let resolvedBaseURL = '/api';
try {
  if (typeof window !== 'undefined') {
    // Allow override via env var
    const envBase = import.meta.env?.VITE_API_BASE;
    if (envBase) {
      resolvedBaseURL = envBase;
    } else if (window.location.port === '5173') {
      // In Vite dev server; some setups may not apply proxy correctly
      // Use direct backend URL as a robust fallback
      resolvedBaseURL = 'http://localhost:8000/api';
    }
  }
} catch (_) {
  // noop
}

const api = axios.create({
  baseURL: resolvedBaseURL,
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
