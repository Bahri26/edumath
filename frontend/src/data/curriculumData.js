export const getCurriculumData = (lang) => [
  {
    grade: 1,
    title: lang === 'tr' ? "1. Sınıf Matematik" : "1st Grade Math",
    description: lang === 'tr' ? "Matematik dünyasına ilk adım. Temel kavramlar." : "First step into the world of math. Basic concepts.",
    topics: lang === 'tr' ? ["Uzamsal İlişkiler", "Doğal Sayılar", "Toplama", "Örüntüler"] : ["Spatial Relationships", "Natural Numbers", "Addition", "Patterns"],
    outcomes: lang === 'tr' 
      ? ["Nesneler arasındaki örüntüyü fark eder.", "20'ye kadar sayar.", "Basit toplama yapar."] 
      : ["Recognizes patterns between objects.", "Counts up to 20.", "Performs simple addition."],
    evaluation: lang === 'tr' ? "Süreç odaklı değerlendirme, oyun temelli etkinlikler." : "Process-oriented evaluation, game-based activities."
  },
  {
    grade: 8,
    title: lang === 'tr' ? "8. Sınıf Matematik (LGS)" : "8th Grade Math (LGS)",
    description: lang === 'tr' ? "Liselere Geçiş Sınavı hazırlık süreci." : "High School Entrance Exam prep.",
    topics: lang === 'tr' ? ["Çarpanlar", "Üslü İfadeler", "Kareköklü İfadeler"] : ["Factors", "Exponentials", "Square Roots"],
    outcomes: lang === 'tr' ? ["Çarpanları bulur.", "Doğrusal denklemleri çözer."] : ["Finds factors.", "Solves linear equations."],
    evaluation: lang === 'tr' ? "LGS simülasyon sınavları." : "LGS simulation exams."
  },
  {
    grade: 12,
    title: lang === 'tr' ? "12. Sınıf Matematik (YKS)" : "12th Grade Math (YKS)",
    description: lang === 'tr' ? "Türev, İntegral ve Limit konuları." : "Derivatives, Integrals and Limits.",
    topics: lang === 'tr' ? ["Limit", "Türev", "İntegral"] : ["Limits", "Derivatives", "Integrals"],
    outcomes: lang === 'tr' ? ["Türev alır.", "İntegral ile alan hesaplar."] : ["Calculates derivatives.", "Calculates area with integrals."],
    evaluation: lang === 'tr' ? "TYT-AYT deneme sınavları." : "University entrance practice exams."
  }
];