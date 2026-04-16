import logo from '../assets/logo.png';

export const getCourses = (lang, t) => [
  {
    id: 1,
    title: lang === 'tr' ? 'Eğlenceli Örüntüler Dünyası' : 'Fun World of Patterns',
    level: lang === 'tr' ? 'İlkokul (1-4. Sınıf)' : 'Primary (Grades 1-4)',
    image: logo,
    lessons: `12 ${t.courses.lessons}`,
    students: `2.4k ${t.courses.students}`,
    rating: '4.9',
    category: 'primary'
  },
  {
    id: 2,
    title: lang === 'tr' ? 'Adım Adım Cebirsel Örüntüler' : 'Algebraic Patterns Step-by-Step',
    level: lang === 'tr' ? 'Ortaokul (5-8. Sınıf)' : 'Middle School (Grades 5-8)',
    image: logo,
    lessons: `18 ${t.courses.lessons}`,
    students: `1.8k ${t.courses.students}`,
    rating: '4.8',
    category: 'middle'
  },
  {
    id: 3,
    title: lang === 'tr' ? 'İleri Düzey Diziler ve Seriler' : 'Advanced Sequences and Series',
    level: lang === 'tr' ? 'Lise (9-12. Sınıf)' : 'High School (Grades 9-12)',
    image: logo,
    lessons: `24 ${t.courses.lessons}`,
    students: `950 ${t.courses.students}`,
    rating: '4.9',
    category: 'high'
  }
];