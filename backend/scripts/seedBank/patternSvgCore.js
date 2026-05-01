/** Senkron SVG üretimi (seed); patternTemplateService ile aynı görsel dil. */

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function choice(list, index) {
  if (!Array.isArray(list) || list.length === 0) return undefined;
  return list[((index % list.length) + list.length) % list.length];
}

function buildSvgBoxPattern({ items = [], size = 72, gap = 14, padding = 16 } = {}) {
  const w = padding * 2 + items.length * size + Math.max(0, items.length - 1) * gap;
  const h = padding * 2 + size;

  const renderItem = (item, idx) => {
    const x = padding + idx * (size + gap);
    const y = padding;
    const box = `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="14" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>`;

    if (!item || item === '?') {
      return box + `<text x="${x + size / 2}" y="${y + size / 2 + 10}" text-anchor="middle" font-size="32" font-family="system-ui,sans-serif" fill="#64748B">?</text>`;
    }

    const cx = x + size / 2;
    const cy = y + size / 2;
    const s = size * 0.28;
    if (item === 'circle') {
      return box + `<circle cx="${cx}" cy="${cy}" r="${s}" fill="#4F46E5"/>`;
    }
    if (item === 'square') {
      return box + `<rect x="${cx - s}" y="${cy - s}" width="${s * 2}" height="${s * 2}" rx="10" fill="#10B981"/>`;
    }
    if (item === 'triangle') {
      const p1 = `${cx},${cy - s * 1.1}`;
      const p2 = `${cx - s * 1.05},${cy + s * 0.98}`;
      const p3 = `${cx + s * 1.05},${cy + s * 0.98}`;
      return box + `<polygon points="${p1} ${p2} ${p3}" fill="#F59E0B"/>`;
    }
    return (
      box
      + `<text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="17" font-family="system-ui,sans-serif" fill="#0F172A">${escapeXml(item)}</text>`
    );
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="20" fill="#FFFFFF"/>
  ${items.map(renderItem).join('\n  ')}
</svg>`;
}

function buildSvgDotsGrid({ n = 1, cols = 8, dot = 12, gap = 8, pad = 18 } = {}) {
  const rows = Math.ceil(n / cols);
  const w = pad * 2 + cols * dot + Math.max(0, cols - 1) * gap;
  const h = pad * 2 + rows * dot + Math.max(0, rows - 1) * gap;
  let dots = '';
  for (let i = 0; i < n; i += 1) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = pad + c * (dot + gap) + dot / 2;
    const y = pad + r * (dot + gap) + dot / 2;
    dots += `<circle cx="${x}" cy="${y}" r="${dot / 2 - 1}" fill="#4F46E5"/>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="14" fill="#FAFAFA" stroke="#E2E8F0"/>
  ${dots}
</svg>`;
}

function wrapCanvas(innerMarkup, subtitle = '') {
  const sub = subtitle
    ? `<text x="500" y="34" text-anchor="middle" font-size="14" fill="#64748B" font-family="system-ui,sans-serif">${escapeXml(subtitle)}</text>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="320" viewBox="0 0 1000 320">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F8FAFC"/>
      <stop offset="100%" style="stop-color:#EEF2FF"/>
    </linearGradient>
  </defs>
  <rect width="1000" height="320" rx="24" fill="url(#bg)" stroke="#C7D2FE" stroke-width="2"/>
  ${sub}
  <g transform="translate(500,172)">${innerMarkup}</g>
</svg>`;
}

function centerInnerTranslate(innerSvg) {
  const stripped = innerSvg.replace(/<\?xml[^?]*\?>/g, '').replace(/width="[^"]*"\s*/g, '').replace(/height="[^"]*"\s*/g, '');
  return `<g transform="translate(-400,-80)">${stripped}</g>`;
}

function buildNumberLineSvg(showTextLine) {
  const body = `
  <svg x="80" y="0" width="840" height="120" viewBox="0 0 840 120">
    <rect width="840" height="120" rx="16" fill="white" stroke="#E2E8F0"/>
    <text x="40" y="78" font-size="32" font-family="system-ui,sans-serif" font-weight="600" fill="#0F172A">${escapeXml(showTextLine)}</text>
  </svg>`;
  return wrapCanvas(body, '');
}

module.exports = {
  escapeXml,
  choice,
  buildSvgBoxPattern,
  buildSvgDotsGrid,
  wrapCanvas,
  centerInnerTranslate,
  buildNumberLineSvg,
};
