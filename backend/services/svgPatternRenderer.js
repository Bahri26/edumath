const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'uploads', 'generated');

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function tokenizePattern(question) {
  const source = String(question.text || question.visualPrompt || 'Oruntu').replace(/\$[^$]*\$/g, ' ');
  const csv = source.match(/(?:\d+|[A-Za-zÇĞİÖŞÜçğıöşü]+)(?:\s*,\s*(?:\d+|[A-Za-zÇĞİÖŞÜçğıöşü]+)){2,}/u);
  if (csv) {
    return csv[0].split(/\s*,\s*/).slice(0, 6);
  }

  const words = source.match(/\b(?:\d+|[A-Za-zÇĞİÖŞÜçğıöşü]+)\b/gu) || [];
  return words.filter((token) => token.length > 1).slice(0, 6);
}

function paletteForDifficulty(difficulty) {
  if (difficulty === 'Zor') {
    return { accent: '#dc2626', soft: '#fee2e2', ink: '#7f1d1d' };
  }
  if (difficulty === 'Kolay') {
    return { accent: '#059669', soft: '#d1fae5', ink: '#065f46' };
  }
  return { accent: '#4f46e5', soft: '#e0e7ff', ink: '#312e81' };
}

function buildSvg(question) {
  const tokens = tokenizePattern(question);
  const palette = paletteForDifficulty(question.difficulty);
  const title = escapeXml(question.topic || 'Oruntu');
  const prompt = escapeXml(question.visualPrompt || question.text || 'Gorsel destekli soru');
  const boxes = (tokens.length ? tokens : ['Oruntu', 'Gorsel', 'Hazir', 'Degil']).map((token, index) => {
    const x = 36 + index * 115;
    return `
      <g transform="translate(${x},126)">
        <rect width="92" height="78" rx="22" fill="${palette.soft}" stroke="${palette.accent}" stroke-width="2" />
        <text x="46" y="46" text-anchor="middle" font-size="22" font-weight="700" fill="${palette.ink}" font-family="Arial, sans-serif">${escapeXml(token)}</text>
      </g>`;
  }).join('');

  return `
<svg width="860" height="320" viewBox="0 0 860 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="860" height="320" rx="32" fill="#F8FAFC"/>
  <rect x="18" y="18" width="824" height="284" rx="26" fill="white" stroke="#E2E8F0" stroke-width="2"/>
  <rect x="36" y="34" width="168" height="34" rx="17" fill="${palette.soft}"/>
  <text x="120" y="56" text-anchor="middle" font-size="16" font-weight="700" fill="${palette.ink}" font-family="Arial, sans-serif">${title}</text>
  <text x="36" y="94" font-size="20" font-weight="700" fill="#0F172A" font-family="Arial, sans-serif">AI gorsel karti</text>
  <text x="36" y="116" font-size="13" fill="#475569" font-family="Arial, sans-serif">${prompt.slice(0, 96)}</text>
  ${boxes}
  <path d="M88 240H772" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="8 8"/>
  <text x="36" y="274" font-size="13" fill="#64748B" font-family="Arial, sans-serif">Bu SVG dosyasi visualPrompt alanindan otomatik uretildi.</text>
</svg>`.trim();
}

function renderPatternSvg(question) {
  ensureOutputDir();
  const safeTopic = String(question.topic || 'pattern').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'pattern';
  const fileName = `${safeTopic}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.svg`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  fs.writeFileSync(filePath, buildSvg(question), 'utf8');
  return `/uploads/generated/${fileName}`;
}

module.exports = {
  renderPatternSvg,
};