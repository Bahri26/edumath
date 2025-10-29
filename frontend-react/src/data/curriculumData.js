// frontend-react/src/data/curriculumData.js (İSTEĞİNİZE GÖRE GÜNCELLENDİ)

export const curriculumData = {
  // Seviye 1: Ana Dersler (Sadece Matematik)
  dersler: ['Matematik'],

  // Seviye 2: Konular (Sadece Örüntüler)
  konular: ['Örüntüler'],

  // Seviye 3: Sınıflar (1'den 12'ye kadar)
  siniflar: Array.from({ length: 12 }, (_, i) => `${i + 1}. Sınıf`),

  // Seviye 4: Soru Tipleri
  soruTipleri: [
    { value: 'test', label: 'Çoktan Seçmeli (Test)' },
    { value: 'dogru-yanlis', label: 'Doğru / Yanlış' },
    { value: 'bosluk-doldurma', label: 'Boşluk Doldurma' },
    { value: 'eslestirme', label: 'Eşleştirme (Yakında)' },
  ],
};