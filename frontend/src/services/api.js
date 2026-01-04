import axios from 'axios';

// Base URL: Use env when available, else Vite dev proxy
const API_BASE = import.meta.env?.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api';

// Optional global error notifier registered from UI layer
let apiErrorNotifier = null;
export const registerApiErrorNotifier = (fn) => {
    apiErrorNotifier = typeof fn === 'function' ? fn : null;
};

const apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    timeout: 15000,
});

// 🚨 1. İSTEK INTERCEPTOR (Token Ekleme)
apiClient.interceptors.request.use(
    (config) => {
        // Token'ı localStorage'dan al (AuthContext ile uyumlu)
        let token = localStorage.getItem('token');
        if (!token) {
            const user = localStorage.getItem('user');
            token = user ? JSON.parse(user)?.token : null;
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 🚨 2. YANIT INTERCEPTOR (401 Hatası Yakalama)
// Eğer token süresi dolmuşsa veya geçersizse kullanıcıyı otomatik çıkış yaptır
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        if (status === 401) {
            console.warn('Oturum süresi doldu, çıkış yapılıyor...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        // Global toast-based error handling (non-401)
        try {
            if (apiErrorNotifier && status !== 401) {
                const path = error?.config?.url || '';
                const msg = error?.response?.data?.message || error.message || 'Beklenmeyen hata';
                if (!error.response) {
                    apiErrorNotifier('Ağ bağlantı hatası. Lütfen kontrol edin.', 'error');
                } else if (status >= 500) {
                    apiErrorNotifier('Sunucu hatası. Lütfen daha sonra tekrar deneyin.', 'error');
                } else if (status === 404) {
                    apiErrorNotifier('İstek bulunamadı: ' + path, 'error');
                } else if (status === 400) {
                    apiErrorNotifier(msg, 'error');
                } else {
                    apiErrorNotifier(msg, 'error');
                }
            }
        } catch {}
        return Promise.reject(error);
    }
);

export default apiClient;