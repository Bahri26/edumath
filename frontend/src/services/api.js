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

// Optional auth failure handler (e.g. 401 -> logout)
let authFailureHandler = null;
export const registerAuthFailureHandler = (fn) => {
    authFailureHandler = typeof fn === 'function' ? fn : null;
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

// 🚨 2. YANIT INTERCEPTOR (401 + 503 cold-start retry)
// - 401: Oturum sonu, kullanıcıyı çıkış yaptır
// - 503 (DB_NOT_READY): Render free-tier cold start sırasında DB henüz bağlanmamış olabilir.
//   Retry-After değerine göre 1 kez (toplam 2 deneme) otomatik tekrar dener.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const COLD_START_NOTICE_DELAY_MS = 1500; // toast göstermeden önce kısa gecikme
let coldStartToastShown = false;
let coldStartToastTimer = null;

const scheduleColdStartNotice = () => {
    if (coldStartToastShown || coldStartToastTimer) return;
    coldStartToastTimer = setTimeout(() => {
        if (!coldStartToastShown && apiErrorNotifier) {
            try {
                apiErrorNotifier(
                    'Sunucu uyanıyor, birkaç saniye sonra otomatik olarak tekrar denenecek...',
                    'info',
                );
            } catch { /* sessiz geç */ }
            coldStartToastShown = true;
        }
        coldStartToastTimer = null;
    }, COLD_START_NOTICE_DELAY_MS);
};

const clearColdStartNotice = () => {
    if (coldStartToastTimer) {
        clearTimeout(coldStartToastTimer);
        coldStartToastTimer = null;
    }
    coldStartToastShown = false;
};

apiClient.interceptors.response.use(
    (response) => {
        clearColdStartNotice();
        if (response?.data) {
            response.data = normalizeAssetUrls(response.data);
        }
        return response;
    },
    async (error) => {
        const status = error?.response?.status;
        const config = error?.config;

        // --- 503 cold-start otomatik retry ---
        if (status === 503 && config && !config.__retryDisabled) {
            const maxRetries = Number.isFinite(config.__maxRetries) ? config.__maxRetries : 2;
            config.__retryCount = (config.__retryCount || 0) + 1;

            if (config.__retryCount <= maxRetries) {
                scheduleColdStartNotice();
                const headerRetry = Number(error?.response?.headers?.['retry-after']);
                const bodyRetry = Number(error?.response?.data?.retryAfterSeconds);
                const baseWait = Number.isFinite(headerRetry) && headerRetry > 0
                    ? headerRetry * 1000
                    : Number.isFinite(bodyRetry) && bodyRetry > 0
                      ? bodyRetry * 1000
                      : 4000;
                // Exponential backoff: 1.deneme = baseWait, 2.deneme = baseWait * 1.5
                const wait = Math.min(15000, baseWait * (1 + (config.__retryCount - 1) * 0.5));
                await sleep(wait);
                return apiClient(config);
            }
        }

        if (status === 401) {
            console.warn('Oturum süresi doldu, çıkış yapılıyor...');
            try {
                authFailureHandler?.(error);
            } catch {
                /* ignore */
            }
        }
        // Global toast-based error handling (non-401)
        try {
            const path = error?.config?.url || '';
            // LoginModal / kayıt formu kendi hata alanında gösterir; çift uyarıyı önle
            const suppressGlobalToast =
                (path.includes('/auth/login') || path.includes('/auth/register')) &&
                (status >= 400 || error?.code === 'ECONNABORTED' || !error?.response);
            if (apiErrorNotifier && status !== 401 && !suppressGlobalToast) {
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
                } else if (status === 503) {
                    apiErrorNotifier(
                        'Sunucu hâlâ hazır değil. Birkaç saniye sonra tekrar deneyin.',
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