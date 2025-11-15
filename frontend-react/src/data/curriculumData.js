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
    // Klasik Sorular
    { value: 'test', label: '✅ Çoktan Seçmeli', icon: '📝', category: 'Klasik' },
    { value: 'dogru-yanlis', label: '✓/✗ Doğru/Yanlış', icon: '✓', category: 'Klasik' },
    { value: 'bosluk-doldurma', label: '✏️ Boşluk Doldurma', icon: '✏️', category: 'Klasik' },
    { value: 'acik-uclu', label: '📝 Açık Uçlu', icon: '📝', category: 'Klasik' },
    
    // İnteraktif Sorular - Eşleştirme Tabanlı
    { value: 'eslestirme', label: '🔗 Eşleştirme', icon: '🔗', category: 'İnteraktif' },
    { value: 'surukle-birak', label: '🎯 Sürükle-Bırak', icon: '🎯', category: 'İnteraktif' },
    { value: 'hafiza-karti', label: '🃏 Hafıza Kartları', icon: '🃏', category: 'İnteraktif' },
    { value: 'eslesmeyi-bul', label: '🔍 Eşleşmeyi Bul', icon: '🔍', category: 'İnteraktif' },
    
    // İnteraktif Sorular - Sıralama Tabanlı
    { value: 'siralama', label: '🔢 Sıralama', icon: '🔢', category: 'İnteraktif' },
    { value: 'kelime-corbasi', label: '💬 Kelime Çorbası', icon: '💬', category: 'İnteraktif' },
    { value: 'grup-siralama', label: '📋 Grup Sıralaması', icon: '📋', category: 'İnteraktif' },
    { value: 'anagram', label: '🔤 Anagram', icon: '🔤', category: 'İnteraktif' },
    
    // İnteraktif Sorular - Görsel/Çizim
    { value: 'cizim', label: '🎨 Çizim', icon: '🎨', category: 'Görsel' },
    { value: 'grafik-ciz', label: '📊 Grafik Çizimi', icon: '📊', category: 'Görsel' },
    { value: 'sayi-dogrusu', label: '📏 Sayı Doğrusu', icon: '📏', category: 'Görsel' },
    { value: 'kesir-gorsel', label: '🍕 Kesir Görseli', icon: '🍕', category: 'Görsel' },
    { value: 'geometri-cizim', label: '📐 Geometri Çizimi', icon: '📐', category: 'Görsel' },
    
    // İnteraktif Sorular - Özel
    { value: 'denklem-kur', label: '🧮 Denklem Kurma', icon: '🧮', category: 'Özel' },
    { value: 'carkifelek', label: '🎡 Çarkıfelek', icon: '🎡', category: 'Özel' },
    { value: 'kutu-ac', label: '📦 Kutuyu Aç', icon: '📦', category: 'Özel' },
    { value: 'eslesme-oyunu', label: '🎮 Eşleşme Oyunu', icon: '🎮', category: 'Özel' },
    { value: 'cumle-tamamla', label: '✍️ Cümle Tamamlama', icon: '✍️', category: 'Özel' },
  ],
};