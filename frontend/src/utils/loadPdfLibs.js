export const loadPdfLibs = async () => {
  if (window._edu_pdf_libs_loaded) return window._edu_pdf_libs_loaded;

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

  // Use jsdelivr CDN; pinned versions to known-good releases
  // Prefer local mirrored assets under /vendor, fall back to CDN
  const localJspdf = '/vendor/jspdf.umd.min.js';
  const localHtml2 = '/vendor/html2canvas.min.js';
  const jspdfUrl = (await fetch(localJspdf, { method: 'HEAD' }).then(r => r.ok).catch(() => false)) ? localJspdf : 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
  const html2canvasUrl = (await fetch(localHtml2, { method: 'HEAD' }).then(r => r.ok).catch(() => false)) ? localHtml2 : 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

  await Promise.all([loadScript(jspdfUrl), loadScript(html2canvasUrl)]);

  // Normalize exports
  const jsPDF = window.jspdf?.jsPDF || window.jsPDF || (window.jspdf && window.jspdf.default && window.jspdf.default.jsPDF);

  window._edu_pdf_libs_loaded = { jsPDF, html2canvas: window.html2canvas };
  return window._edu_pdf_libs_loaded;
};
