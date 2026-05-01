import axios from 'axios';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const viteBackendUrl = trimTrailingSlash(import.meta.env?.VITE_API_URL || '');

/** Sunucu kökü (/uploads burada); VITE_API_URL bazen …/api ile biter — görseller /api/uploads altında değildir. */
export const getBackendOrigin = () => {
    if (!viteBackendUrl) {
        return '';
    }
    return viteBackendUrl.replace(/\/api\/?$/i, '') || viteBackendUrl;
};

// Base URL: Use env when available, else Vite dev proxy
const API_BASE = viteBackendUrl
    ? (/\/api\/?$/i.test(viteBackendUrl) ? viteBackendUrl : `${viteBackendUrl}/api`)
    : '/api';

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

    // Geliştirme: ön yüz :5173, API :8000 — görselleri kökten /uploads ile iste (Vite proxy).
    // Aksi halde http://localhost:8000/uploads... kullanılır; ortamda engellenebiliyor.
    if (import.meta.env.DEV && typeof window !== 'undefined') {
        const apiRoot = getBackendOrigin();
        if (apiRoot) {
            try {
                const apiHost = new URL(apiRoot).host;
                if (apiHost && apiHost !== window.location.host) {
                    return '';
                }
            } catch {
                /* ignore */
            }
        }
    }

    const origin = getBackendOrigin();
    if (origin) {
        return origin;
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

    let v = value.trim().replace(/\\/g, '/');

    if (v.startsWith('blob:') || v.startsWith('data:')) {
        return v;
    }

    if (/^https?:\/\//i.test(v)) {
        if (/\/api\/uploads\//i.test(v)) {
            return v.replace(/^(https?:\/\/[^/]+)\/api(\/uploads\/)/i, '$1$2');
        }
        return v;
    }

    if (v.startsWith('/api/uploads/')) {
        v = `/uploads/${v.slice('/api/uploads/'.length).replace(/^\/+/, '')}`;
    } else if (/^api\/uploads\//i.test(v)) {
        v = `/uploads/${v.replace(/^api\/uploads\/?/i, '').replace(/^\/+/, '')}`;
    }

    // Bazı eski kayıtlar "/uploads" öneki olmadan klasör adı ile gelebilir (örn: "generated/..svg")
    if (!v.startsWith('/uploads/') && !v.startsWith('uploads/')) {
        const knownRoots = [
            'generated/',
            'pattern-templates/',
            'patterns/',
            'seed-math-bank/',
            'seed-pattern-bank/',
            'temp/',
        ];
        if (knownRoots.some((root) => v.startsWith(root))) {
            v = `/uploads/${v}`;
        }
    }

    const path = v.startsWith('/uploads/')
        ? v
        : v.startsWith('uploads/')
          ? `/${v}`
          : null;
    if (!path) {
        return v;
    }

    const assetBase = getAssetBaseUrl();
    return assetBase ? `${assetBase}${path}` : path;
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
                } else if (status === 429) {
                    const hint = error?.response?.data?.hint;
                    const retryAfter = error?.response?.headers?.['retry-after'];
                    const wait = retryAfter ? ` ${retryAfter} sn sonra tekrar deneyin.` : ' Bir süre sonra tekrar deneyin.';
                    apiErrorNotifier(
                        `Kota/limit aşıldı.${wait}${hint ? ' ' + hint : ''}`,
                        'error',
                    );
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
        } catch {
            /* apiErrorNotifier kendi içinde patlarsa sessiz geçilir */
        }
        return Promise.reject(error);
    }
);

export default apiClient;
export { AI_TIMEOUT, AUTH_TIMEOUT, DEFAULT_TIMEOUT };