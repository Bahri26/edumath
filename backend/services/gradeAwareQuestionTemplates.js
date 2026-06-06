/**
 * Sınıf ve zorluk seviyesine uygun soru şablonları (1–4. sınıf ilkokul odaklı).
 */

const MEB_REF = 'MEB Matematik Öğretim Programı (2018) — sınıf düzeyine uygun yerel üretim';

const ELEMENTARY_THEMES = [
  { items: ['kırmızı', 'mavi'], label: 'renkli boncuklar', unit: 'boncuk' },
  { items: ['elma', 'armut'], label: 'meyve tabağı', unit: 'meyve' },
  { items: ['2', '4'], label: 'oyun alanı', unit: 'sayı' },
  { items: ['5', '10'], label: 'sayı doğrusu', unit: 'sayı' },
];

function parseGradeFromClassLevel(classLevel) {
  const m = String(classLevel || '').match(/(\d+)/);
  if (!m) return 5;
  const g = parseInt(m[1], 10);
  return Number.isFinite(g) ? Math.min(12, Math.max(1, g)) : 5;
}

function isElementaryGrade(classLevel) {
  return parseGradeFromClassLevel(classLevel) <= 4;
}

function isSampleTooAdvancedForGrade(text, classLevel) {
  const grade = parseGradeFromClassLevel(classLevel);
  const t = String(text || '').toLowerCase();
  if (grade <= 4) {
    if (/\b\d+\s*x\b|2x|3x|4x|cebir|kural hangisi|birim küp|küp say/.test(t)) return true;
    if (/cm|çevre|cevre|eşkenar|eskenar|altıgen|altigen|üçgen|ucgen/.test(t)) return true;
    if (/terim|\. terim|genel terim|a_n|formül/.test(t)) return true;
    if (/hangisi daha hızlı|daha hızlı artar|azalan örüntü/.test(t)) return true;
  }
  if (grade <= 6) {
    if (/\b\d+\s*x\b|2x\+|3x|4x/.test(t)) return true;
  }
  return false;
}

function filterPoolSamplesForGeneration(samples, { classLevel, difficulty } = {}) {
  const list = (samples || []).filter((s) => String(s.text || '').trim());
  const diff = String(difficulty || '').trim();
  const grade = parseGradeFromClassLevel(classLevel);

  let filtered = list.filter((s) => !isSampleTooAdvancedForGrade(s.text, classLevel));

  if (diff && diff !== 'Tümü') {
    const byDiff = filtered.filter((s) => String(s.difficulty || '').trim() === diff);
    if (byDiff.length) filtered = byDiff;
  }

  if (classLevel && classLevel !== 'Tümü') {
    const byClass = filtered.filter((s) => String(s.classLevel || '').trim() === classLevel);
    if (byClass.length) filtered = byClass;
  }

  if (grade <= 4) {
    filtered = filtered.filter((s) => {
      const g = parseGradeFromClassLevel(s.classLevel);
      return !s.classLevel || g <= 4;
    });
  }

  return filtered.length ? filtered : list.filter((s) => !isSampleTooAdvancedForGrade(s.text, classLevel));
}

function resolveTemplateKind(kind, classLevel) {
  const grade = parseGradeFromClassLevel(classLevel);
  if (grade <= 4) return 'elementary';
  if (grade <= 6) {
    if (kind === 'algebraic_rule') return 'arithmetic';
    if (kind === 'triangle_perimeter' || kind === 'hexagon') return 'arithmetic';
  }
  if (grade <= 8 && kind === 'algebraic_rule') return 'arithmetic';
  return kind === 'generic' ? 'arithmetic' : kind;
}

function buildSolutionLines(lines) {
  return lines.filter(Boolean).map((line, i) => `${i + 1}. ${line}`).join('\n');
}

function seededIndex(key, max) {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return max > 0 ? h % max : 0;
}

function templateElementaryPattern(classLevel, difficulty, seed) {
  const grade = parseGradeFromClassLevel(classLevel);
  const diff = String(difficulty || 'Kolay').toLowerCase();
  const theme = ELEMENTARY_THEMES[seededIndex(seed, ELEMENTARY_THEMES.length)];

  if (diff.startsWith('zor')) {
    const start = 10 + seededIndex(`${seed}-z`, 6);
    const seq = [start, start - 2, start - 4, start - 6];
    const next = start - 8;
    const opts = [String(next), String(next + 2), String(next - 2), String(start)]
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 4);
    return {
      text: `${theme.label.charAt(0).toUpperCase() + theme.label.slice(1)} tablosunda ${seq.join(', ')}, ... örüntüsü azalmaktadır. Sıradaki sayı hangisidir?`,
      options: opts,
      correctAnswer: String(next),
      solution: buildSolutionLines([
        'Her adımda 2 azalıyor.',
        `${seq[seq.length - 1]} − 2 = ${next}.`,
        `Doğru cevap ${next} şıkkıdır.`,
      ]),
      learningOutcome: 'Azalan basit sayı örüntüsünü devam ettirir.',
    };
  }

  if (diff.startsWith('kol') || grade <= 2) {
    const [a, b] = theme.items;
    if (theme.unit === 'sayı') {
      return {
        text: `${theme.label.charAt(0).toUpperCase() + theme.label.slice(1)} üzerinde ${a}, ${b}, ${a}, ${b}, ${a}, ... sayı örüntüsü var. Boşluğa hangi sayı gelmelidir?`,
        options: [String(b), String(a), String(Number(a) + Number(b) || 6), String(Number(b) + 1)],
        correctAnswer: String(b),
        solution: buildSolutionLines([
          `Sayılar ${a} ve ${b} olarak sırayla tekrar ediyor.`,
          `${a} sayısından sonra ${b} gelir.`,
          `Doğru cevap ${b} şıkkıdır.`,
        ]),
        learningOutcome: 'Tekrar eden sayı örüntüsünde sıradaki terimi bulur.',
      };
    }
    return {
      text: `${theme.label.charAt(0).toUpperCase() + theme.label.slice(1)} dizisinde ${a}, ${b}, ${a}, ${b}, ... örüntüsü var. Sıradaki ${theme.unit} hangisidir?`,
      options: [a, b, 'sarı', 'yeşil'].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4),
      correctAnswer: a,
      solution: buildSolutionLines([
        `Örüntü ${a} ve ${b} ile tekrar ediyor.`,
        `${b} öğesinden sonra yine ${a} gelir.`,
        `Doğru cevap ${a} şıkkıdır.`,
      ]),
      learningOutcome: 'Tekrarlayan nesne ve renk örüntülerini sürdürür.',
    };
  }

  const increment = grade <= 2 ? 2 : (seededIndex(`${seed}-inc`, 2) === 0 ? 2 : 5);
  const first = increment * (1 + seededIndex(`${seed}-f`, 3));
  const seq = Array.from({ length: 4 }, (_, i) => first + increment * i);
  const next = first + increment * 4;
  const opts = [String(next), String(next + increment), String(next - increment), String(first)]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 4);
  return {
    text: `${theme.label.charAt(0).toUpperCase() + theme.label.slice(1)} üzerinde ${seq.join(', ')}, ... örüntüsü her adımda ${increment} artmaktadır. Sıradaki sayı hangisidir?`,
    options: opts.length >= 4 ? opts : [...opts, String(next + 1), String(next + 2)].slice(0, 4),
    correctAnswer: String(next),
    solution: buildSolutionLines([
      `Her adımda ${increment} ekleniyor.`,
      `Son görünen terim ${seq[seq.length - 1]}; devamı ${next}.`,
      `Doğru cevap ${next} şıkkıdır.`,
    ]),
    learningOutcome: 'Artan sayı örüntüsünde kuralı bulup devam ettirir.',
  };
}

module.exports = {
  MEB_REF,
  parseGradeFromClassLevel,
  isElementaryGrade,
  isSampleTooAdvancedForGrade,
  filterPoolSamplesForGeneration,
  resolveTemplateKind,
  templateElementaryPattern,
};
