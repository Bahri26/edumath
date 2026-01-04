export const getCourses = (lang, t) => [
  {
    id: 1,
    title: lang === 'tr' ? 'LGS Matematik Kampı' : 'LGS Math Camp',
    level: lang === 'tr' ? '8. Sınıf' : '8th Grade',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    lessons: `24 ${t.courses.lessons}`,
    students: `1.2k ${t.courses.students}`,
    rating: '4.9',
    price: '₺750'
  },
  {
    id: 2,
    title: lang === 'tr' ? 'TYT-AYT Matematik' : 'University Prep Math',
    level: lang === 'tr' ? '12. Sınıf & Mezun' : '12th Grade & Grads',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    lessons: `48 ${t.courses.lessons}`,
    students: `3.5k ${t.courses.students}`,
    rating: '4.8',
    price: '₺1200'
  },
  {
    id: 3,
    title: lang === 'tr' ? 'Sıfırdan Geometri' : 'Geometry from Scratch',
    level: lang === 'tr' ? 'Tüm Seviyeler' : 'All Levels',
    image: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    lessons: `32 ${t.courses.lessons}`,
    students: `850 ${t.courses.students}`,
    rating: '4.7',
    price: '₺900'
  }
];