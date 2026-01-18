export const getCurriculumData = (lang) => {
  const data = {
    tr: [
      // İLKOKUL KADEMESİ
      {
        grade: 1,
        levelName: "İlkokul - Başlangıç",
        title: "Nesne ve Şekil Örüntüleri",
        description: "Çevremizdeki düzeni fark etme ve basit tekrarlayan yapıları anlama.",
        topics: ["Renk örüntüleri", "Geometrik şekil dizilimleri", "Tekrarlayan nesne grupları"],
        outcomes: [
          "Nesnelerden oluşan basit bir örüntüdeki kuralı fark eder.",
          "Eksik bırakılan öğeyi örüntüye uygun tamamlar.",
          "Kendi basit örüntüsünü oluşturur."
        ],
        evaluation: "Görsel sürükle-bırak oyunları ve boyama etkinlikleri."
      },
      {
        grade: 2,
        levelName: "İlkokul - Temel",
        title: "Artan ve Azalan Örüntüler",
        description: "Sayılar ve şekiller arasındaki artış/azalış miktarını keşfetme.",
        topics: ["Ritmik saymalar", "Artan sayı dizileri", "Şekil-sayı ilişkisi"],
        outcomes: [
          "Aralarındaki fark sabit olan sayı örüntülerini genişletir.",
          "Örüntünün kuralını sözel olarak ifade eder.",
          "Farklı nesnelerle aynı kurala sahip örüntüler kurar."
        ],
        evaluation: "Eksik sayıyı bulma bulmacaları ve interaktif sayı kartları."
      },
      {
        grade: 3,
        levelName: "İlkokul - Orta",
        title: "Kuralı Keşfetme",
        description: "Karmaşıklaşan sayı dizilerinde gizli kuralları bulma süreci.",
        topics: ["İki adımlı kurallar", "Sayı tablolarında örüntü", "Şekil modelleri"],
        outcomes: [
          "Artış veya azalış miktarını hesaplayarak kuralı belirler.",
          "Kuralı verilen bir örüntünün istenen adımını bulur.",
          "Hatalı verilmiş bir örüntü adımını düzeltir."
        ],
        evaluation: "Örüntü dedektifliği oyunları ve kısa cevaplı sorular."
      },
      {
        grade: 4,
        levelName: "İlkokul - İleri",
        title: "Matematiksel İlişkiler",
        description: "Sayı örüntülerini problem çözme süreçlerine dahil etme.",
        topics: ["Sayı dizilerinde mantık", "Tablo ve grafik örüntüleri", "Gerçek hayat modelleri"],
        outcomes: [
          "En çok iki işlem içeren sayı örüntülerini analiz eder.",
          "Örüntüleri tablo kullanarak görselleştirir.",
          "Verilen bir kurala göre sayı dizisi oluşturur."
        ],
        evaluation: "Problem senaryoları ve dijital tablo oluşturma araçları."
      },

      // ORTAOKUL KADEMESİ
      {
        grade: 5,
        levelName: "Ortaokul - Giriş",
        title: "Aritmetik Dizilere Giriş",
        description: "Sayılar arasındaki sabit farkın cebirsel düşünceye aktarılması.",
        topics: ["Sabit farkla artan diziler", "Adım-Sayı tabloları", "Sözelden sayıla aktarım"],
        outcomes: [
          "Adımlar arasındaki farkı belirleyerek bir sonraki adımı tahmin eder.",
          "Günlük hayattaki bir durumu sayı örüntüsü olarak modeller."
        ],
        evaluation: "Adım-sayı eşleştirme testleri ve video tabanlı anlatımlar."
      },
      {
        grade: 6,
        levelName: "Ortaokul - Temel",
        title: "Cebirsel İfade ve Örüntü",
        description: "Örüntü kuralını 'n' değişkeni kullanarak genel terimle ifade etme.",
        topics: ["Genel terim kavramı", "n harfinin kullanımı", "Sayısal örüntülerin analizi"],
        outcomes: [
          "Aritmetik örüntülerin kuralını harfle (n) ifade eder.",
          "Genel kuralı verilen örüntünün 100. adımını hesaplar."
        ],
        evaluation: "Cebirsel ifade kurma interaktif alıştırmaları."
      },
      {
        grade: 7,
        levelName: "Ortaokul - Orta",
        title: "Doğrusal İlişkiler",
        description: "Örüntülerin koordinat sistemi üzerinde gösterimi ve analizi.",
        topics: ["Doğrusal örüntüler", "Grafik çizimi", "Değişim oranı"],
        outcomes: [
          "Örüntüleri koordinat sisteminde noktalarla gösterir.",
          "Bağımlı ve bağımsız değişken arasındaki ilişkiyi kurar."
        ],
        evaluation: "Grafik çizim araçları ve açık uçlu modelleme soruları."
      },
      {
        grade: 8,
        levelName: "Ortaokul - LGS Hazırlık",
        title: "Sayı Dizileri ve Analiz",
        description: "LGS mantığına uygun, yeni nesil örüntü problemleri.",
        topics: ["Geometrik artan modeller", "Karesel sayılar", "Üçgensel sayılar"],
        outcomes: [
          "Karmaşık şekil modellerini sayı dizilerine dönüştürür.",
          "Yeni nesil mantık muhakeme sorularını örüntü bilgisiyle çözer."
        ],
        evaluation: "LGS deneme formatında çoktan seçmeli sorular."
      },

      // LİSE KADEMESİ
      {
        grade: 9,
        levelName: "Lise - Mantık ve Diziler",
        title: "Matematiksel Modelleme",
        description: "Örüntülerin fonksiyonel yaklaşımla incelenmesi.",
        topics: ["Fonksiyonel örüntüler", "Veri analizi", "Tahminleme"],
        outcomes: [
          "Gerçek hayat verilerinden örüntü çıkarımı yapar.",
          "Örüntüleri fonksiyon kavramıyla ilişkilendirir."
        ],
        evaluation: "Proje tabanlı ödevler ve veri analizi simülasyonları."
      },
      {
        grade: 11,
        levelName: "Lise - AYT Hazırlık",
        title: "Diziler ve Seriler",
        description: "Aritmetik ve geometrik dizilerin derinlemesine incelenmesi.",
        topics: ["Aritmetik Diziler", "Geometrik Diziler", "Toplam Sembolü (Σ)"],
        outcomes: [
          "Dizilerin genel terimini ve toplam formüllerini kullanır.",
          "Aritmetik ve geometrik diziler arasındaki farkı analiz eder.",
          "Toplam sembolü ile ifade edilen serileri hesaplar."
        ],
        evaluation: "AYT seviyesinde analitik testler ve formül uygulama çalışmaları."
      },
      {
        grade: 12,
        levelName: "Lise - İleri Matematik",
        title: "Limit ve Sonsuz Diziler",
        description: "Dizilerin yakınsaklığı ve sonsuza giden örüntülerin davranışı.",
        topics: ["Yakınsak diziler", "Fibonacci Dizisi ve Altın Oran", "Fraktallar"],
        outcomes: [
          "Bir dizinin limitini kavramsal olarak açıklar.",
          "Doğadaki örüntüleri (Fibonacci vb.) matematiksel olarak modeller.",
          "Fraktal yapıların oluşum mantığını kavrar."
        ],
        evaluation: "Araştırma sunumları ve ileri düzey matematiksel ispatlar."
      }
    ],
    en: [
      // İngilizce çeviriler buraya eklenebilir...
    ]
  };

  return data[lang] || data['tr'];
};