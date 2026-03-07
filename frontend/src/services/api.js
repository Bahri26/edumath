import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL,
});

// --- İSTEK GÖNDERİRKEN TOKEN EKLE ---
api.interceptors.request.use(
    (config) => {
        // 1. LocalStorage'dan kullanıcıyı oku
        const storedUser = localStorage.getItem('edumath_user');
        let user = null;
        if (storedUser) {
            try {
                user = JSON.parse(storedUser);
            } catch (e) {
                user = null;
            }
        }
        // 2. Eğer kullanıcının token'ı varsa, başlığa ekle
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- CEVAP GELİRKEN 401 HATASINI YAKALA ---
api.interceptors.response.use(
    (response) => response, // Başarılı cevapları olduğu gibi döndür
    (error) => {
        // If we have a response error, broadcast it so UI can display a banner
        const resp = error.response;
        if (resp) {
            // Allow callers to opt-out of global error dispatch by setting header 'x-no-auth-redirect'
            const skip = resp.config && resp.config.headers && (resp.config.headers['x-no-auth-redirect'] || resp.config.headers['X-No-Auth-Redirect']);
            const evtDetail = { status: resp.status, data: resp.data, url: resp.config && resp.config.url };
            // If server returned a short 'missing token' message, treat as expected for unauthenticated public pages and don't show banner
            const bodyMsg = resp.data && (resp.data.error || resp.data.message);
            const suppressMissingToken = resp.status === 401 && (bodyMsg === 'missing token' || bodyMsg === 'Missing token' || bodyMsg === 'token missing');
            if (!skip && !suppressMissingToken) {
                try { window.dispatchEvent(new CustomEvent('api:error', { detail: evtDetail })); } catch (e) { /* ignore */ }
            }
            // 401 -> invalidate session
            if (resp.status === 401) {
                // Allow callers to opt-out of automatic redirect by setting header 'x-no-auth-redirect'
                const skipRedirect = resp.config && resp.config.headers && (resp.config.headers['x-no-auth-redirect'] || resp.config.headers['X-No-Auth-Redirect']);
                localStorage.removeItem('edumath_user');
                if (!skipRedirect) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;