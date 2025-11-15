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

// Global 401 / refresh handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      const data = error.response?.data || {};
      const originalRequest = error.config;

      // Try refresh only once per request and only if token expired indicators present
      const tokenExpired = data?.expired || /süresi doldu|expired/i.test(data?.message || '');
      if (tokenExpired && !originalRequest?._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            // Use baseURL directly to avoid interceptor loop issues
            const refreshResp = await axios.post(`${resolvedBaseURL}/auth/refresh`, { refreshToken });
            const newAccess = refreshResp.data?.accessToken || refreshResp.data?.token;
            if (newAccess) {
              localStorage.setItem('token', newAccess);
              api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
              originalRequest.headers.Authorization = `Bearer ${newAccess}`;
              return api(originalRequest); // retry original
            }
          } catch (refreshErr) {
            console.warn('Refresh token yenileme başarısız:', refreshErr.response?.data || refreshErr.message);
          }
        }
      }

      // Dispatch a browser event so UI (AuthContext vs routing) can react
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: data }));
        }
      } catch (_) { /* ignore */ }

      // Optionally clear invalid tokens if format error
      if (/geçersiz token|formatı/i.test(data?.message || '')) {
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(error);
  }
);
