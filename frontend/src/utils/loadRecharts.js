// Dynamically load Recharts UMD from CDN to avoid bundling it in the app.
export default function loadRecharts() {
    if (typeof window === 'undefined') return Promise.reject(new Error('window is undefined'));
    if (window.Recharts) return Promise.resolve(window.Recharts);
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/recharts/umd/Recharts.min.js';
        s.async = true;
        s.onload = () => {
            if (window.Recharts) return resolve(window.Recharts);
            // Some CDNs expose under different names; fall back to global keys
            const glob = window.Recharts || window.recharts || window.RechartsDefault;
            if (glob) return resolve(glob);
            reject(new Error('Recharts not found on window after script load'));
        };
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
    });
}
