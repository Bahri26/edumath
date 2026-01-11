// Generates curriculum-aligned math courses for grades 1–12
// Lightweight seed data to drive the Courses page by student grade

const colors = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-fuchsia-500',
];

function make(id, grade, title, opts = {}) {
  const total = opts.totalModules ?? 12;
  const completed = opts.completedModules ?? Math.max(0, Math.min(total, Math.round((opts.progress ?? 0) * total / 100)));
  return {
    id,
    title,
    progress: opts.progress ?? 0,
    totalModules: total,
    completedModules: completed,
    color: colors[id % colors.length],
    classLevel: String(grade),
    category: opts.category || 'Müfredat',
  };
}

function forPrimary(grade) {
  const baseId = grade * 100;
  return [
    make(baseId + 1, grade, 'Sayılar ve İşlemler'),
    make(baseId + 2, grade, 'Örüntüler ve Modeller'),
    make(baseId + 3, grade, 'Geometri Temelleri'),
  ];
}

function forMiddle(grade) {
  const baseId = grade * 100;
  return [
    make(baseId + 1, grade, 'Sayılar ve Cebir', { totalModules: 16 }),
    make(baseId + 2, grade, 'Geometri', { totalModules: 14 }),
    make(baseId + 3, grade, 'Olasılık ve Veri', { totalModules: 10 }),
    make(baseId + 4, grade, 'Oran-Orantı', { totalModules: 12 }),
  ];
}

function forHigh(grade) {
  const baseId = grade * 100;
  if (grade <= 10) {
    return [
      make(baseId + 1, grade, 'Temel Matematik', { totalModules: 18, category: 'TYT' }),
      make(baseId + 2, grade, 'Fonksiyonlar ve Polinomlar', { totalModules: 14, category: 'TYT' }),
      make(baseId + 3, grade, 'Geometri', { totalModules: 12, category: 'TYT' }),
    ];
  }
  // 11–12: AYT odaklı
  return [
    make(baseId + 1, grade, 'TYT Matematik', { totalModules: 20, category: 'TYT' }),
    make(baseId + 2, grade, 'AYT Geometri', { totalModules: 16, category: 'AYT' }),
    make(baseId + 3, grade, 'Analitik Geometri', { totalModules: 12, category: 'AYT' }),
    make(baseId + 4, grade, 'Türev ve İntegral', { totalModules: 14, category: 'AYT' }),
  ];
}

export function getCoursesForGrade(grade) {
  if (!Number.isFinite(grade) || grade < 1 || grade > 12) {
    return [];
  }
  if (grade <= 4) return forPrimary(grade);
  if (grade <= 8) return forMiddle(grade);
  return forHigh(grade);
}
