export const getCourses = (lang, t) => [
  {
    id: 1,
    title: lang === 'tr' ? 'Eğlenceli Örüntüler Dünyası' : 'Fun World of Patterns',
    level: lang === 'tr' ? 'İlkokul (1-4. Sınıf)' : 'Primary (Grades 1-4)',
    category: 'primary',
    scrollGrade: 1,
    lessons: `12 ${t.courses.lessons}`,
    students: lang === 'tr' ? 'Demo içerik' : 'Demo content',
    rating: '4.9',
  },
  {
    id: 2,
    title: lang === 'tr' ? 'Adım Adım Cebirsel Örüntüler' : 'Algebraic Patterns Step-by-Step',
    level: lang === 'tr' ? 'Ortaokul (5-8. Sınıf)' : 'Middle School (Grades 5-8)',
    category: 'middle',
    scrollGrade: 5,
    lessons: `18 ${t.courses.lessons}`,
    students: lang === 'tr' ? 'Demo içerik' : 'Demo content',
    rating: '4.8',
  },
  {
    id: 3,
    title: lang === 'tr' ? 'İleri Düzey Diziler ve Seriler' : 'Advanced Sequences and Series',
    level: lang === 'tr' ? 'Lise (9-12. Sınıf)' : 'High School (Grades 9-12)',
    category: 'high',
    scrollGrade: 9,
    lessons: `24 ${t.courses.lessons}`,
    students: lang === 'tr' ? 'Demo içerik' : 'Demo content',
    rating: '4.9',
  },
];

export const COURSE_VISUALS = {
  primary: {
    gradient: 'from-orange-400 via-amber-400 to-yellow-300',
    icon: 'sparkles',
    pattern: '● ▲ ● ▲ ●',
  },
  middle: {
    gradient: 'from-teal-500 via-sky-500 to-cyan-400',
    icon: 'trending',
    pattern: '2 · 4 · 6 · 8',
  },
  high: {
    gradient: 'from-sky-600 via-teal-500 to-cyan-400',
    icon: 'sigma',
    pattern: 'Σ · f(n) · ∞',
  },
};
