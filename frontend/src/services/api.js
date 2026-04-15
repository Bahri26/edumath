import axios from 'axios';

// Base URL: Use env when available, else Vite dev proxy
const API_BASE = import.meta.env?.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const parseTimeout = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const DEFAULT_TIMEOUT = parseTimeout(import.meta.env?.VITE_API_TIMEOUT_MS, 15000);
const AUTH_TIMEOUT = parseTimeout(import.meta.env?.VITE_AUTH_TIMEOUT_MS, 30000);
const AI_TIMEOUT = parseTimeout(import.meta.env?.VITE_AI_TIMEOUT_MS, 45000);

const getAssetBaseUrl = () => {
    const explicitAssetBase = trimTrailingSlash(import.meta.env?.VITE_ASSET_BASE_URL || '');
    if (explicitAssetBase) {
        return explicitAssetBase;
    }

    const apiBase = trimTrailingSlash(import.meta.env?.VITE_API_URL || '');
    if (apiBase) {
        return apiBase;
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        return trimTrailingSlash(window.location.origin);
    }

    return '';
};

export const resolveAssetUrl = (value) => {
    if (typeof value !== 'string' || !value) {
        return value;
    }

    if (/^https?:\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:')) {
        return value;
    }

    if (!value.startsWith('/uploads/')) {
        return value;
    }

    const assetBase = getAssetBaseUrl();
    return assetBase ? `${assetBase}${value}` : value;
};

const normalizeAssetUrls = (payload) => {
    if (Array.isArray(payload)) {
        return payload.map(normalizeAssetUrls);
    }

    if (!payload || typeof payload !== 'object') {
        return resolveAssetUrl(payload);
    }

    return Object.fromEntries(
        Object.entries(payload).map(([key, value]) => {
            if (typeof value === 'string' && (key === 'image' || key === 'imagePath')) {
                return [key, resolveAssetUrl(value)];
            }

            return [key, normalizeAssetUrls(value)];
        })
    );
};

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
    timeout: DEFAULT_TIMEOUT,
});

export const withRequestConfig = (config = {}, timeout = DEFAULT_TIMEOUT) => ({
    ...config,
    timeout,
});

export const withAuthRequestConfig = (config = {}) => withRequestConfig(config, AUTH_TIMEOUT);
export const withAiRequestConfig = (config = {}) => withRequestConfig(config, AI_TIMEOUT);

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
    (response) => {
        if (response?.data) {
            response.data = normalizeAssetUrls(response.data);
        }
        return response;
    },
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
                if (error?.code === 'ECONNABORTED') {
                    const timeoutMessage = path.includes('/auth/login')
                        ? 'Giriş isteği zaman aşımına uğradı. Sunucu geç cevap veriyor; lütfen tekrar deneyin.'
                        : 'İşlem zaman aşımına uğradı. Sunucu geç cevap veriyor; tekrar deneyin veya AI timeout süresini artırın.';
                    apiErrorNotifier(timeoutMessage, 'error');
                } else if (!error.response) {
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
export { AI_TIMEOUT, AUTH_TIMEOUT, DEFAULT_TIMEOUT };