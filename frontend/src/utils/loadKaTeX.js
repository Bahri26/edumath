export const loadKaTeX = async () => {
  if (window._edu_katex_loaded) return window._edu_katex_loaded;

  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => res();
    s.onerror = () => rej(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });

  const loadCss = (href) => new Promise((res, rej) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.onload = () => res();
    l.onerror = () => rej(new Error('Failed to load ' + href));
    document.head.appendChild(l);
  });


  // Prefer local mirrored assets under /vendor, fall back to CDN
  const localCss = '/vendor/katex.min.css';
  const localJs = '/vendor/katex.min.js';
  const katexCss = (await fetch(localCss, { method: 'HEAD' }).then(r => r.ok).catch(() => false)) ? localCss : 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
  const katexJs = (await fetch(localJs, { method: 'HEAD' }).then(r => r.ok).catch(() => false)) ? localJs : 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';

  await Promise.all([loadCss(katexCss), loadScript(katexJs)]);

  window._edu_katex_loaded = { katex: window.katex };
  return window._edu_katex_loaded;
};
