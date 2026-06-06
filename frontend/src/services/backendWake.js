import axios from 'axios';
import { getBackendOrigin } from './api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** /ready uç noktası kökte; Vite dev proxy veya VITE_API_URL kökü. */
export function getReadyUrl() {
    const origin = getBackendOrigin();
    if (origin) {
        return `${origin}/ready`;
    }
    // Geliştirme: vite.config proxy /ready → backend
    return '/ready';
}

/**
 * Render free-tier cold start: Node + MongoDB hazır olana kadar /ready pingler.
 * Sunucu zaten ayaktaysa tek istekte (~1 sn) döner.
 */
export async function wakeBackend({ maxWaitMs = 90000, onProgress } = {}) {
    const readyUrl = getReadyUrl();
    const startedAt = Date.now();
    let attempt = 0;

    while (Date.now() - startedAt < maxWaitMs) {
        attempt += 1;
        if (attempt > 1) {
            onProgress?.(
                'Sunucu uyanıyor; ilk girişte bu 1 dakikaya kadar sürebilir. Lütfen bekleyin…',
            );
        }

        try {
            const res = await axios.get(readyUrl, {
                timeout: 12000,
                validateStatus: () => true,
            });
            const dbUp = res.data?.db === 'up' || res.data?.status === 'ready';
            if (res.status === 200 && dbUp) {
                return { ready: true, waitedMs: Date.now() - startedAt, attempts: attempt };
            }
            if (res.status === 503 || res.data?.code === 'DB_NOT_READY') {
                await sleep(Math.min(5000, 1500 + attempt * 400));
                continue;
            }
        } catch {
            // TCP/timeout — servis henüz dinlemiyor olabilir
        }

        await sleep(Math.min(6000, 2000 + attempt * 300));
    }

    return { ready: false, waitedMs: Date.now() - startedAt, attempts: attempt };
}
