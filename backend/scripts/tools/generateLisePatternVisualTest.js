/**
 * 10–12. sınıf görsel destekli örüntü test paketi üretir.
 * Çıktı: backend/uploads/patterns/lise-test/*.svg + manifest.json
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', '..', 'uploads', 'patterns', 'lise-test');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeSvg(filename, content) {
  const full = path.join(OUT_DIR, filename);
  fs.writeFileSync(full, content.trim(), 'utf8');
  return `/uploads/patterns/lise-test/${filename}`;
}

function svgCanvas(title, subtitle, body, palette = {}) {
  const bg = palette.bg || '#F8FAFC';
  const accent = palette.accent || '#4338CA';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="320" viewBox="0 0 900 320">
  <rect width="900" height="320" rx="24" fill="${bg}"/>
  <text x="36" y="44" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="${accent}">${title}</text>
  ${body}
  <text x="36" y="298" font-family="Arial, sans-serif" font-size="16" fill="#64748B">${subtitle}</text>
</svg>`;
}

function buildGrade10Visuals() {
  const q1 = writeSvg(
    'g10-kolay-led-cogalma.svg',
    svgCanvas(
      'LED Panel — Geometrik Çoğalma',
      'Her adımda hücre sayısı 3 ile çarpılıyor. 5. adımda kaç hücre vardır?',
      `
  <g transform="translate(40,70)">
    <text x="0" y="0" font-size="14" fill="#475569">Adım 1</text>
    <rect x="0" y="12" width="36" height="36" rx="6" fill="#818CF8"/>
    <text x="60" y="38" font-size="24" fill="#6366F1">×3</text>
    <text x="100" y="0" font-size="14" fill="#475569">Adım 2</text>
    <rect x="100" y="12" width="36" height="36" rx="6" fill="#6366F1"/>
    <rect x="142" y="12" width="36" height="36" rx="6" fill="#6366F1"/>
    <rect x="184" y="12" width="36" height="36" rx="6" fill="#6366F1"/>
    <text x="240" y="38" font-size="24" fill="#6366F1">×3</text>
    <text x="280" y="0" font-size="14" fill="#475569">Adım 3</text>
    <g transform="translate(280,12)">
      ${Array.from({ length: 9 }, (_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        return `<rect x="${col * 38}" y="${row * 38}" width="34" height="34" rx="5" fill="#4F46E5"/>`;
      }).join('\n      ')}
    </g>
    <text x="440" y="38" font-size="24" fill="#6366F1">×3</text>
    <text x="480" y="0" font-size="14" fill="#475569">Adım 4</text>
    <text x="480" y="50" font-size="28" font-weight="700" fill="#3730A3">27 hücre</text>
    <text x="620" y="0" font-size="14" fill="#475569">Adım 5</text>
    <rect x="620" y="12" width="200" height="120" rx="12" fill="#EEF2FF" stroke="#818CF8" stroke-width="2" stroke-dasharray="8 6"/>
    <text x="720" y="78" text-anchor="middle" font-size="36" font-weight="700" fill="#4338CA">?</text>
  </g>
  <text x="480" y="230" font-size="18" fill="#312E81">Terimler: 1 → 3 → 9 → 27 → ?</text>`,
      { bg: '#EEF2FF', accent: '#312E81' }
    )
  );

  const q2 = writeSvg(
    'g10-orta-azalan-karo.svg',
    svgCanvas(
      'Azalan Karo Modeli',
      'Her adımda alan üçte bire iniyor. Ortak oran kaçtır?',
      `
  <rect x="80" y="80" width="180" height="180" rx="8" fill="#6366F1" opacity="0.9"/>
  <text x="170" y="178" text-anchor="middle" font-size="28" font-weight="700" fill="#fff">729</text>
  <path d="M280 170 L340 170" stroke="#94A3B8" stroke-width="3" marker-end="url(#arrow)"/>
  <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#94A3B8"/></marker></defs>
  <rect x="360" y="110" width="120" height="120" rx="8" fill="#818CF8"/>
  <text x="420" y="182" text-anchor="middle" font-size="24" font-weight="700" fill="#fff">243</text>
  <path d="M500 170 L560 170" stroke="#94A3B8" stroke-width="3" marker-end="url(#arrow)"/>
  <rect x="580" y="140" width="80" height="80" rx="8" fill="#A5B4FC"/>
  <text x="620" y="188" text-anchor="middle" font-size="20" font-weight="700" fill="#fff">81</text>
  <path d="M680 170 L740 170" stroke="#94A3B8" stroke-width="3" marker-end="url(#arrow)"/>
  <rect x="760" y="158" width="54" height="54" rx="8" fill="#C7D2FE"/>
  <text x="787" y="192" text-anchor="middle" font-size="18" font-weight="700" fill="#4338CA">27</text>`,
      { bg: '#F5F3FF', accent: '#5B21B6' }
    )
  );

  const q3 = writeSvg(
    'g10-zor-toplam-cubuk.svg',
    svgCanvas(
      'Geometrik Dizi — Toplam Grafiği',
      'a_n = 4·2^(n-1) dizisinin ilk 4 teriminin toplamı kaçtır?',
      `
  <rect x="120" y="200" width="60" height="40" fill="#6366F1"/><text x="150" y="255" text-anchor="middle" font-size="16" fill="#4338CA">4</text>
  <rect x="220" y="160" width="60" height="80" fill="#4F46E5"/><text x="250" y="255" text-anchor="middle" font-size="16" fill="#4338CA">8</text>
  <rect x="320" y="80" width="60" height="160" fill="#4338CA"/><text x="350" y="255" text-anchor="middle" font-size="16" fill="#4338CA">16</text>
  <rect x="420" y="0" width="60" height="240" fill="#3730A3"/><text x="450" y="255" text-anchor="middle" font-size="16" fill="#4338CA">32</text>
  <line x1="100" y1="240" x2="520" y2="240" stroke="#94A3B8" stroke-width="2"/>
  <rect x="560" y="60" width="280" height="180" rx="16" fill="#fff" stroke="#C7D2FE" stroke-width="2"/>
  <text x="700" y="120" text-anchor="middle" font-size="20" fill="#475569">S₄ = 4 + 8 + 16 + 32</text>
  <text x="700" y="170" text-anchor="middle" font-size="32" font-weight="700" fill="#4338CA">S₄ = ?</text>`,
      { bg: '#EEF2FF', accent: '#3730A3' }
    )
  );

  return [
    {
      id: 'G10-K1',
      classLevel: '10. Sınıf',
      difficulty: 'Kolay',
      image: q1,
      text: 'Yukarıdaki LED panel modelinde her adımda hücre sayısı 3 ile çarpılmaktadır. 5. adımdaki hücre sayısı kaçtır?',
      options: ['54', '81', '243', '729'],
      correctAnswer: '81',
      solution: '1, 3, 9, 27, 81 → a₅ = 3⁴ = 81.',
    },
    {
      id: 'G10-O1',
      classLevel: '10. Sınıf',
      difficulty: 'Orta',
      image: q2,
      text: 'Görseldeki karelerin alanları 729, 243, 81, 27 şeklinde azalmaktadır. Bu geometrik dizinin ortak oranı kaçtır?',
      options: ['1/2', '1/3', '2/3', '3'],
      correctAnswer: '1/3',
      solution: 'Her terim bir öncekinin 1/3 üdür; r = 1/3.',
    },
    {
      id: 'G10-Z1',
      classLevel: '10. Sınıf',
      difficulty: 'Zor',
      image: q3,
      text: 'Grafikte a_n = 4·2^(n-1) geometrik dizisinin ilk dört terimi gösterilmiştir. S₄ toplamı kaçtır?',
      options: ['52', '56', '60', '64'],
      correctAnswer: '60',
      solution: 'S₄ = 4(2⁴−1) = 4×15 = 60.',
    },
  ];
}

function buildGrade11Visuals() {
  const q1 = writeSvg(
    'g11-kolay-kare-nokta.svg',
    svgCanvas(
      'Kare Sayı Örüntüsü',
      'Her gruptaki mavi nokta sayısı bir tam kareyi temsil eder.',
      `
  <text x="120" y="100" font-size="14" fill="#475569">1² = 1</text>
  <circle cx="130" cy="130" r="8" fill="#7C3AED"/>
  <text x="230" y="100" font-size="14" fill="#475569">2² = 4</text>
  <g transform="translate(210,115)">
    <circle cx="10" cy="10" r="7" fill="#7C3AED"/><circle cx="30" cy="10" r="7" fill="#7C3AED"/>
    <circle cx="10" cy="30" r="7" fill="#7C3AED"/><circle cx="30" cy="30" r="7" fill="#7C3AED"/>
  </g>
  <text x="360" y="100" font-size="14" fill="#475569">3² = 9</text>
  <g transform="translate(340,108)">
    ${Array.from({ length: 9 }, (_, i) => {
      const c = i % 3;
      const r = Math.floor(i / 3);
      return `<circle cx="${c * 22 + 10}" cy="${r * 22 + 10}" r="7" fill="#7C3AED"/>`;
    }).join('\n    ')}
  </g>
  <text x="520" y="100" font-size="14" fill="#475569">4² = 16</text>
  <g transform="translate(500,100)">
    ${Array.from({ length: 16 }, (_, i) => {
      const c = i % 4;
      const r = Math.floor(i / 4);
      return `<circle cx="${c * 18 + 8}" cy="${r * 18 + 8}" r="6" fill="#7C3AED"/>`;
    }).join('\n    ')}
  </g>
  <rect x="700" y="95" width="140" height="100" rx="12" fill="#F5F3FF" stroke="#C4B5FD" stroke-dasharray="6 4"/>
  <text x="770" y="155" text-anchor="middle" font-size="32" font-weight="700" fill="#6D28D9">?</text>
  <text x="770" y="185" text-anchor="middle" font-size="14" fill="#475569">5² = ?</text>`,
      { bg: '#FAF5FF', accent: '#6D28D9' }
    )
  );

  const q2 = writeSvg(
    'g11-orta-artan-fark.svg',
    svgCanvas(
      'Artan Fark Örüntüsü',
      'Sütun yükseklikleri arasındaki farklar incelenmelidir.',
      `
  <rect x="100" y="180" width="70" height="50" fill="#8B5CF6"/><text x="135" y="250" text-anchor="middle" font-size="18" fill="#5B21B6">5</text>
  <rect x="210" y="155" width="70" height="75" fill="#7C3AED"/><text x="245" y="250" text-anchor="middle" font-size="18" fill="#5B21B6">10</text>
  <text x="175" y="145" font-size="14" fill="#059669">+5</text>
  <rect x="320" y="120" width="70" height="110" fill="#6D28D9"/><text x="355" y="250" text-anchor="middle" font-size="18" fill="#5B21B6">17</text>
  <text x="285" y="110" font-size="14" fill="#059669">+7</text>
  <rect x="430" y="75" width="70" height="155" fill="#5B21B6"/><text x="465" y="250" text-anchor="middle" font-size="18" fill="#5B21B6">26</text>
  <text x="395" y="65" font-size="14" fill="#059669">+9</text>
  <rect x="540" y="20" width="70" height="210" fill="#4C1D95" stroke="#C4B5FD" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="575" y="250" text-anchor="middle" font-size="22" font-weight="700" fill="#5B21B6">?</text>
  <text x="505" y="10" font-size="14" fill="#059669">+11</text>
  <line x1="80" y1="230" x2="640" y2="230" stroke="#94A3B8" stroke-width="2"/>`,
      { bg: '#F5F3FF', accent: '#5B21B6' }
    )
  );

  const q3 = writeSvg(
    'g11-zor-parabol-nokta.svg',
    svgCanvas(
      'a_n = n² + 2n — Koordinat Modeli',
      'Grafikteki noktalar dizinin ilk terimlerini göstermektedir.',
      `
  <line x1="80" y1="240" x2="820" y2="240" stroke="#64748B" stroke-width="2"/>
  <line x1="120" y1="260" x2="120" y2="60" stroke="#64748B" stroke-width="2"/>
  <circle cx="180" cy="210" r="10" fill="#7C3AED"/><text x="175" y="200" font-size="13" fill="#475569">n=1</text><text x="195" y="215" font-size="14" fill="#6D28D9">3</text>
  <circle cx="280" cy="180" r="10" fill="#7C3AED"/><text x="275" y="170" font-size="13" fill="#475569">n=2</text><text x="295" y="185" font-size="14" fill="#6D28D9">8</text>
  <circle cx="380" cy="140" r="10" fill="#7C3AED"/><text x="375" y="130" font-size="13" fill="#475569">n=3</text><text x="395" y="145" font-size="14" fill="#6D28D9">15</text>
  <circle cx="480" cy="90" r="10" fill="#7C3AED"/><text x="475" y="80" font-size="13" fill="#475569">n=4</text><text x="495" y="95" font-size="14" fill="#6D28D9">24</text>
  <rect x="600" y="100" width="250" height="120" rx="14" fill="#fff" stroke="#C4B5FD" stroke-width="2"/>
  <text x="725" y="145" text-anchor="middle" font-size="18" fill="#475569">a₅ + a₆ = ?</text>
  <text x="725" y="185" text-anchor="middle" font-size="15" fill="#64748B">a_n = n² + 2n</text>`,
      { bg: '#FAF5FF', accent: '#6D28D9' }
    )
  );

  return [
    {
      id: 'G11-K1',
      classLevel: '11. Sınıf',
      difficulty: 'Kolay',
      image: q1,
      text: 'Görseldeki kare nokta grupları 1, 4, 9, 16 şeklinde ilerlemektedir. Sıradaki gruptaki nokta sayısı kaçtır?',
      options: ['20', '25', '30', '36'],
      correctAnswer: '25',
      solution: 'Kare sayı dizisi: 5² = 25.',
    },
    {
      id: 'G11-O1',
      classLevel: '11. Sınıf',
      difficulty: 'Orta',
      image: q2,
      text: 'Sütun yükseklikleri 5, 10, 17, 26, ... şeklinde artmaktadır. Bir sonraki sütunun değeri kaçtır?',
      options: ['35', '37', '39', '41'],
      correctAnswer: '37',
      solution: 'Farklar 5, 7, 9 → sonraki fark 11; 26 + 11 = 37.',
    },
    {
      id: 'G11-Z1',
      classLevel: '11. Sınıf',
      difficulty: 'Zor',
      image: q3,
      text: 'Grafik a_n = n² + 2n dizisini göstermektedir. a₅ + a₆ toplamı kaçtır?',
      options: ['79', '83', '87', '91'],
      correctAnswer: '83',
      solution: 'a₅ = 5²+10 = 35, a₆ = 6²+12 = 48 → toplam 83.',
    },
  ];
}

function buildGrade12Visuals() {
  const q1 = writeSvg(
    'g12-kolay-dogrusal-cizgi.svg',
    svgCanvas(
      'Doğrusal Dizi — Sayı Doğrusu',
      'Eşit aralıklarla artan terimler',
      `
  <line x1="80" y1="160" x2="820" y2="160" stroke="#94A3B8" stroke-width="4"/>
  <circle cx="140" cy="160" r="22" fill="#0EA5E9"/><text x="132" y="168" font-size="18" font-weight="700" fill="#fff">7</text>
  <circle cx="260" cy="160" r="22" fill="#0284C7"/><text x="249" y="168" font-size="18" font-weight="700" fill="#fff">12</text>
  <circle cx="380" cy="160" r="22" fill="#0369A1"/><text x="369" y="168" font-size="18" font-weight="700" fill="#fff">17</text>
  <circle cx="500" cy="160" r="22" fill="#075985"/><text x="489" y="168" font-size="18" font-weight="700" fill="#fff">22</text>
  <circle cx="620" cy="160" r="22" fill="#E2E8F0" stroke="#94A3B8" stroke-dasharray="6 4"/><text x="612" y="168" font-size="18" font-weight="700" fill="#475569">?</text>
  <text x="200" y="130" font-size="14" fill="#059669">+5</text>
  <text x="320" y="130" font-size="14" fill="#059669">+5</text>
  <text x="440" y="130" font-size="14" fill="#059669">+5</text>
  <rect x="680" y="90" width="180" height="90" rx="12" fill="#fff" stroke="#BAE6FD" stroke-width="2"/>
  <text x="770" y="130" text-anchor="middle" font-size="16" fill="#475569">a_n = 5n + 2</text>
  <text x="770" y="158" text-anchor="middle" font-size="15" fill="#64748B">15. terim?</text>`,
      { bg: '#F0F9FF', accent: '#0369A1' }
    )
  );

  const q2 = writeSvg(
    'g12-orta-geometrik-toplam.svg',
    svgCanvas(
      'Geometrik Toplam — Basamak Modeli',
      'Her basamak bir öncekinin 2 katı',
      `
  <rect x="100" y="210" width="50" height="30" fill="#14B8A6"/><text x="125" y="255" text-anchor="middle" font-size="14" fill="#0F766E">3</text>
  <rect x="170" y="180" width="50" height="60" fill="#0D9488"/><text x="195" y="255" text-anchor="middle" font-size="14" fill="#0F766E">6</text>
  <rect x="240" y="150" width="50" height="90" fill="#0F766E"/><text x="265" y="255" text-anchor="middle" font-size="14" fill="#0F766E">12</text>
  <rect x="310" y="90" width="50" height="150" fill="#115E59"/><text x="335" y="255" text-anchor="middle" font-size="14" fill="#0F766E">24</text>
  <rect x="380" y="30" width="50" height="210" fill="#134E4A"/><text x="405" y="255" text-anchor="middle" font-size="14" fill="#0F766E">48</text>
  <rect x="450" y="0" width="50" height="240" fill="#042F2E"/><text x="475" y="255" text-anchor="middle" font-size="14" fill="#0F766E">96</text>
  <line x1="80" y1="240" x2="530" y2="240" stroke="#94A3B8" stroke-width="2"/>
  <rect x="560" y="80" width="300" height="150" rx="16" fill="#fff" stroke="#99F6E4" stroke-width="2"/>
  <text x="710" y="130" text-anchor="middle" font-size="18" fill="#134E4A">S₆ = 3 + 6 + 12 + 24 + 48 + 96</text>
  <text x="710" y="175" text-anchor="middle" font-size="28" font-weight="700" fill="#0F766E">S₆ = ?</text>`,
      { bg: '#F0FDFA', accent: '#0F766E' }
    )
  );

  const q3 = writeSvg(
    'g12-zor-fibonacci-spiral.svg',
    svgCanvas(
      'Fibonacci Dizisi — Spiral Model',
      'Her yeni kare, önceki iki karenin toplam boyutundadır.',
      `
  <rect x="120" y="170" width="30" height="30" fill="#F59E0B" stroke="#D97706"/><text x="135" y="190" text-anchor="middle" font-size="14" fill="#fff">1</text>
  <rect x="150" y="170" width="30" height="30" fill="#FBBF24" stroke="#D97706"/><text x="165" y="190" text-anchor="middle" font-size="14" fill="#fff">1</text>
  <rect x="120" y="140" width="60" height="30" fill="#F97316" stroke="#C2410C"/><text x="150" y="160" text-anchor="middle" font-size="14" fill="#fff">2</text>
  <rect x="180" y="110" width="60" height="60" fill="#EA580C" stroke="#C2410C"/><text x="210" y="145" text-anchor="middle" font-size="16" fill="#fff">3</text>
  <rect x="120" y="50" width="90" height="90" fill="#DC2626" stroke="#991B1B"/><text x="165" y="100" text-anchor="middle" font-size="18" fill="#fff">5</text>
  <rect x="210" y="50" width="150" height="150" fill="#B91C1C" stroke="#991B1B" stroke-dasharray="8 5"/><text x="285" y="130" text-anchor="middle" font-size="28" font-weight="700" fill="#fff">?</text>
  <text x="500" y="120" font-size="20" fill="#92400E">1, 1, 2, 3, 5, ?</text>
  <text x="500" y="160" font-size="16" fill="#64748B">F_n = F_{n-1} + F_{n-2}</text>`,
      { bg: '#FFFBEB', accent: '#B45309' }
    )
  );

  return [
    {
      id: 'G12-K1',
      classLevel: '12. Sınıf',
      difficulty: 'Kolay',
      image: q1,
      text: 'Sayı doğrusundaki örüntü a_n = 5n + 2 kuralına uygundur. 15. terim kaçtır?',
      options: ['72', '75', '77', '80'],
      correctAnswer: '77',
      solution: 'a₁₅ = 5×15 + 2 = 77.',
    },
    {
      id: 'G12-O1',
      classLevel: '12. Sınıf',
      difficulty: 'Orta',
      image: q2,
      text: 'Grafikte ilk terimi 3 ve ortak oranı 2 olan geometrik dizinin ilk 6 teriminin toplamı gösterilmektedir. S₆ kaçtır?',
      options: ['186', '189', '192', '195'],
      correctAnswer: '189',
      solution: 'S₆ = 3(2⁶−1) = 3×63 = 189.',
    },
    {
      id: 'G12-Z1',
      classLevel: '12. Sınıf',
      difficulty: 'Zor',
      image: q3,
      text: 'Fibonacci spiral modelinde 1, 1, 2, 3, 5 terimlerinden sonra soru işaretli karenin kenar uzunluğu (dizinin 6. terimi) kaçtır?',
      options: ['6', '7', '8', '9'],
      correctAnswer: '8',
      solution: 'F₆ = F₅ + F₄ = 5 + 3 = 8.',
    },
  ];
}

function main() {
  ensureDir(OUT_DIR);
  const questions = [
    ...buildGrade10Visuals(),
    ...buildGrade11Visuals(),
    ...buildGrade12Visuals(),
  ];

  const manifest = {
    title: '10–12. Sınıf Görsel Örüntüler Test Paketi',
    mebReference: 'MEB Matematik Öğretim Programı (2018)',
    generatedAt: new Date().toISOString(),
    questionCount: questions.length,
    questions,
  };

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`\n✓ ${questions.length} görsel soru üretildi → ${OUT_DIR}\n`);
  for (const q of questions) {
    console.log(`[${q.id}] ${q.classLevel} / ${q.difficulty}`);
    console.log(`  Görsel: ${q.image}`);
    console.log(`  ${q.text}`);
    console.log(`  Cevap: ${q.correctAnswer}\n`);
  }
}

main();
