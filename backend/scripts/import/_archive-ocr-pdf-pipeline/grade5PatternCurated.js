/**
 * 5. Sınıf örüntü PDF — manuel soru metni, şık, cevap, çözüm.
 * PDF Test 14–16 (Banko Soru Bankası) ile uyumlu.
 */
const PAGE_DIAGRAM_CROPS = {
  1: { pageFile: '5-sinif/page-01.png', leftRatio: 0, topRatio: 0.19, widthRatio: 0.46, heightRatio: 0.055 },
  3: { pageFile: '5-sinif/page-01.png', leftRatio: 0, topRatio: 0.735, widthRatio: 0.46, heightRatio: 0.075 },
  4: { pageFile: '5-sinif/page-01.png', leftRatio: 0.5, topRatio: 0.19, widthRatio: 0.46, heightRatio: 0.12 },
  5: { pageFile: '5-sinif/crops/p2-s1.png', column: 'left' },
  7: { pageFile: '5-sinif/crops/p2-s1.png', column: 'left' },
  8: { pageFile: '5-sinif/crops/p2-s3.png', column: 'left' },
  9: { pageFile: '5-sinif/crops/p2-s1.png', column: 'right' },
  10: { pageFile: '5-sinif/crops/p2-s4.png', column: 'right' },
  12: { pageFile: '5-sinif/page-03.png', leftRatio: 0, topRatio: 0.12, widthRatio: 0.92, heightRatio: 0.06 },
  14: { pageFile: '5-sinif/page-03.png', leftRatio: 0, topRatio: 0.58, widthRatio: 0.92, heightRatio: 0.08 },
  15: { pageFile: '5-sinif/page-04.png', leftRatio: 0, topRatio: 0.08, widthRatio: 0.92, heightRatio: 0.22 },
  16: { file: '5-sinif/crops/p4-s1.png', column: 'full' },
  17: { file: '5-sinif/crops/p4-s1.png', column: 'full' },
  18: { file: '5-sinif/crops/p5-s1.png', column: 'full' },
  19: { file: '5-sinif/crops/p5-s3.png', column: 'full' },
  20: { file: '5-sinif/crops/p6-s1.png', column: 'full' },
  21: { file: '5-sinif/crops/p6-s2.png', column: 'full' },
};

/** sequenceIndex → kırpım dosyası (region resolver yerine) */
const IMAGE_SOURCE = {
  5: { file: '5-sinif/crops/p2-s1.png', column: 'left' },
  8: { file: '5-sinif/crops/p2-s3.png', column: 'left' },
  9: { file: '5-sinif/crops/p2-s1.png', column: 'right' },
  10: { file: '5-sinif/crops/p2-s4.png', column: 'right' },
  15: { file: '5-sinif/crops/p4-s1.png', column: 'full' },
  16: { file: '5-sinif/crops/p4-s1.png', column: 'full' },
  17: { file: '5-sinif/crops/p4-s1.png', column: 'full' },
  18: { file: '5-sinif/crops/p5-s1.png', column: 'full' },
  19: { file: '5-sinif/crops/p5-s3.png', column: 'full' },
  20: { file: '5-sinif/crops/p6-s1.png', column: 'full' },
  21: { file: '5-sinif/crops/p6-s2.png', column: 'full' },
};

const CURATED = {
  1: {
    text: 'Belirli bir kurala göre dizilmiş sayılar aşağıda verilmiştir. Buna göre turuncu kare ile mavi karenin toplamı aşağıdakilerden hangisidir?',
    options: ['15', '33', '48', '52'],
    correctAnswer: '48',
    solution: '1. Sayılar 6\'şar artmaktadır: 3, 9, 15, 21, 27, 33.\n2. Turuncu kare 15, mavi kare 33\'tür.\n3. 15 + 33 = 48 → C şıkkı.',
  },
  2: {
    text: '15 — 19 — 23 — 25 — 27 — 31 sayı dizisinin bir örüntü oluşturması için hangi sayı çıkarılmalıdır?',
    options: ['15', '23', '25', '31'],
    correctAnswer: '25',
    solution: '1. Dizide 15→19→23 (+4) vardır; 25 sonrası düzensiz.\n2. 25 çıkarılırsa 15, 19, 23, 27, 31 kalır (+4).\n3. Doğru cevap C) 25.',
    skipImage: true,
  },
  3: {
    text: 'Bir kitaplığın rafında bulunan dosyaların numaraları bir örüntü oluşturmaktadır. Buna göre rafta kaç numaralı dosya bulunmaz?',
    options: ['28', '32', '35', '36'],
    correctAnswer: '35',
    solution: '1. Dosya numaraları 4\'er artmaktadır: 12, 16, 20, 24, …, 40.\n2. 28, 32, 36 dizide vardır; 35 yoktur.\n3. Doğru cevap C) 35.',
  },
  4: {
    text: 'İlk üç adımı verilen ve karelerden oluşan şekil örüntüsünde 4. adımda kaç kare kullanılır?',
    options: ['6', '7', '9', '10'],
    correctAnswer: '10',
    solution: '1. Kare sayısı 1, 4, 7 şeklinde 3\'er artmaktadır.\n2. 4. adım: 7 + 3 = 10 kare.\n3. Doğru cevap D) 10.',
  },
  5: {
    text: 'Birim küplerle oluşturulmuş bir örüntünün ilk üç adımı aşağıda verilmiştir. Buna göre örüntünün kuralı aşağıdakilerden hangisidir?',
    options: ['4 × (Adım Sayısı)', '2 × (Adım Sayısı) + 2', '5 × (Adım Sayısı) − 1', '3 × (Adım Sayısı)'],
    correctAnswer: '2 × (Adım Sayısı) + 2',
    solution: '1. Küp sayıları 4, 6, 8 … şeklinde 2\'şer artmaktadır.\n2. n. adımda 2n + 2 birim küp vardır.\n3. Doğru cevap B) 2 × (Adım Sayısı) + 2.',
  },
  6: {
    text: '6 — 12 — 18 — 24 — 30 — …… İlk beş adımı verilen örüntünün kuralı aşağıdakilerden hangisidir?',
    options: [
      'Adım sayısının 5 fazlası',
      'Adım sayısının 10 katının 4 eksiği',
      'Adım sayısının 6 katı',
      'Adım sayısının 3 katının 3 fazlası',
    ],
    correctAnswer: 'Adım sayısının 6 katı',
    solution: '1. Adımlar 6, 12, 18, 24, 30 → her adım 6\'nın katı.\n2. Kural: Adım sayısının 6 katı.\n3. Doğru cevap C.',
    skipImage: true,
  },
  7: {
    text: '24 — 30 — 36 — 42 — 48 — …… Bir örüntünün ilk beş adımı verildiğine göre 50. adımı kaçtır?',
    options: ['246', '300', '318', '600'],
    correctAnswer: '318',
    solution: '1. Her adımda +6 artış vardır.\n2. aₙ = 24 + (n − 1) × 6 = 6n + 18.\n3. 50. adım: 6 × 50 + 18 = 318 → C şıkkı.',
    skipImage: true,
  },
  8: {
    text: 'Yukarıdaki bir örüntünün ilk üç adımı verilmiştir. I. 2 × (Adım Sayısı) − 1, II. 2 × (Adım Sayısı) − 3, III. Adım Sayısı + 2 ifadelerinden hangileri örüntünün kuralı olabilir?',
    options: ['Yalnız I', 'I ve II', 'II ve III', 'I, II ve III'],
    correctAnswer: 'Yalnız I',
    solution: '1. Birim sayıları 1, 3, 5 … → kural 2n − 1.\n2. Yalnız I. ifade uyar.\n3. Doğru cevap A) Yalnız I.',
  },
  9: {
    text: 'Altıgenlerle oluşturulmuş bir örüntünün ilk üç adımı verilmiştir. Buna göre örüntünün 42. adımında kaç tane altıgen vardır?',
    options: ['21', '42', '84', '168'],
    correctAnswer: '84',
    solution: '1. Altıgen sayısı 2, 4, 6 … → kural 2n.\n2. 42. adım: 2 × 42 = 84 altıgen.\n3. Doğru cevap C) 84.',
  },
  10: {
    text: 'Kenar uzunlukları 2 cm olan eşkenar üçgenlerle oluşturulmuş bir örüntü aşağıda verilmiştir. Buna göre örüntünün 5. adımında oluşan şeklin çevre uzunluğu kaç cm\'dir?',
    options: ['11', '17', '22', '28'],
    correctAnswer: '22',
    solution: '1. 5. adımda 5 üçgen yan yana dizilmiştir.\n2. Çevre uzunluğu 22 cm olarak hesaplanır.\n3. Doğru cevap C) 22.',
  },
  11: {
    text: 'Bir örüntünün kuralı "adım sayısının 2 katının 1 fazlası" olduğuna göre bu örüntü aşağıdakilerden hangisi olabilir?',
    options: ['2 — 4 — 6 — 8 — ……', '3 — 6 — 9 — 12 — ……', '3 — 5 — 7 — 9 — ……', '1 — 3 — 5 — 7 — 9 — ……'],
    correctAnswer: '3 — 5 — 7 — 9 — ……',
    solution: '1. Kural 2n + 1 → 3, 5, 7, 9, …\n2. Bu diziye uyan şık C\'dir.\n3. Doğru cevap C.',
    skipImage: true,
  },
  12: {
    text: 'Dokuz tane eş kareye ayrılan bir kağıt sırasıyla sarı, turuncu ve mor renge boyanıyor. Buna göre kaç kare sarı renge boyanmıştır?',
    options: ['1', '3', '6', '9'],
    correctAnswer: '3',
    solution: '1. Renk örüntüsü 3\'lü tekrar: sarı, turuncu, mor.\n2. 9 ÷ 3 = 3 döngü → 3 sarı kare.\n3. Doğru cevap B) 3.',
  },
  13: {
    text: 'Bir deneme sınavının yoklama listesi "ad soyad ve imza" şeklinde eş bölmelerden oluşmaktadır. Yoklama listesinde toplam 20 bölme olduğuna göre bölmelerin kaç tanesi imza için ayrılmıştır?',
    options: ['5', '10', '15', '20'],
    correctAnswer: '10',
    solution: '1. Örüntü: Ad Soyad, İmza (2\'li tekrar).\n2. 20 ÷ 2 = 10 imza bölmesi.\n3. Doğru cevap B) 10.',
    skipImage: true,
  },
  14: {
    text: 'Kenar uzunlukları 6 cm ve 234 cm olan dikdörtgen şeklinde bir karton aşağıda verilmiştir. Kenan bu kartonu kenar uzunluğu 6 cm olan kare şeklindeki eş parçalara ayırarak sırasıyla turuncu, pembe, mavi, mavi, yeşil olacak şekilde boyuyor. Buna göre Kenan kaç parçayı mavi renge boyamıştır?',
    options: ['13', '14', '15', '16'],
    correctAnswer: '16',
    solution: '1. 234 ÷ 6 = 39 kare parça.\n2. Renk örüntüsü 5\'li: turuncu, pembe, mavi, mavi, yeşil.\n3. 39 = 7×5 + 4 → 7×2 + 2 = 16 mavi parça → D şıkkı.',
  },
  15: {
    text: 'Kenar uzunluğu 5 cm olan karelerle oluşturulmuş bir şekil örüntüsünün ilk üç adımı görselde verilmiştir. (15–17. sorular bu örüntüye göre cevaplanacaktır.) Bu örüntüdeki kare sayısını veren kural aşağıdakilerden hangisi olabilir?',
    options: ['3 × (Adım Sayısı)', '2 × (Adım Sayısı) + 1', '5 × (Adım Sayısı) − 2', '(Adım Sayısı) + 2'],
    correctAnswer: '2 × (Adım Sayısı) + 1',
    solution: '1. Kare sayıları 3, 5, 7 … → 2n + 1.\n2. Doğru cevap B) 2 × (Adım Sayısı) + 1.',
  },
  16: {
    text: 'Bu örüntüdeki şeklin çevre uzunluğunu veren kural aşağıdakilerden hangisi olabilir? (Görsele bakınız.)',
    options: ['2 × (Adım Sayısı) + 1', '40 × (Adım Sayısı)', '20 × (Adım Sayısı) + 20', '60 × (Adım Sayısı) − 20'],
    correctAnswer: '20 × (Adım Sayısı) + 20',
    solution: '1. Her kare kenarı 5 cm; çevre adım sayısına göre 20n + 20 cm.\n2. Doğru cevap C) 20 × (Adım Sayısı) + 20.',
  },
  17: {
    text: 'Bu örüntünün 40. adımındaki şeklin çevre uzunluğu kaç cm\'dir? (Görsele bakınız.)',
    options: ['81', '800', '820', '1000'],
    correctAnswer: '820',
    solution: '1. Çevre kuralı: 20 × (Adım Sayısı) + 20.\n2. 40. adım: 20 × 40 + 20 = 820 cm.\n3. Doğru cevap C) 820.',
  },
  18: {
    text: 'Üçüncü adımları eşit olan iki örüntü görselde verilmiştir. Örüntüler eşit adımları üst üste gelecek şekilde birleştirildiğinde kurdele örüntüsü oluşur. Buna göre aşağıda verilen şekillerden hangisi kurdele örüntüsü değildir?',
    options: ['Şekil I', 'Şekil II', 'Şekil III', 'Şekil IV'],
    correctAnswer: 'Şekil III',
    solution: '1. Kurdele örüntüsünde iki örüntünün eşit adımları üst üste gelmelidir.\n2. Şekil III bu koşulu sağlamaz.\n3. Doğru cevap C) Şekil III.',
  },
  19: {
    text: 'Derin renkleri farklı olan kartonlardan üçgen ve daire keserek aşağıda ilk üç adımı verilen örüntüyü oluşturmuştur. Derin üçgen ve dairelerin her birini eşit sürede keserek bu şekil örüntüsünün 1. adımını 5 dakikada oluşturmuştur. Buna göre Derin\'in bu örüntünün 10. adımını oluşturmak için kaç dakikaya ihtiyacı vardır?',
    options: ['29', '30', '32', '35'],
    correctAnswer: '32',
    solution: '1. 1. adımda 5 şekil, 5 dakika → 1 dk/şekil.\n2. 10. adımda 3×10 + 2 = 32 şekil.\n3. 32 dakika → C şıkkı.',
  },
  20: {
    text: 'Kibrit çöpleri ile oluşturulan bir şekil örüntüsünün ilk üç adımı görselde verilmiştir. Buna göre bu örüntü ile ilgili aşağıdakilerden hangisi yanlıştır?',
    options: [
      'Örüntüdeki kibrit çöpü sayısını veren kural "4 × (Adım Sayısı) + 1" dir.',
      'Örüntünün 6. adımında kullanılan kibrit çöpü sayısı bir doğal sayının karesine eşittir.',
      'Örüntünün ilk beş adımını oluşturmak için 65 kibrit çöpü kullanılır.',
      'Her adımda bir önceki adıma göre kibrit çöpü sayısı beşer beşer artmıştır.',
    ],
    correctAnswer: 'Her adımda bir önceki adıma göre kibrit çöpü sayısı beşer beşer artmıştır.',
    solution: '1. Kibrit sayısı 5, 9, 13 … → kural 4n + 1.\n2. A, B, C doğru; D yanlıştır (4\'er artış).\n3. Doğru cevap D.',
  },
  21: {
    text: 'Kutularla oluşturulan bir şekil örüntüsünün ilk üç adımı görselde verilmiştir. Buna göre 4. adımda kaç kutu kullanılır?',
    options: ['8', '10', '12', '14'],
    correctAnswer: '10',
    solution: '1. Kutu sayısı 3, 6, 10 … (üçgensel artış).\n2. 4. adım: 10 kutu.\n3. Doğru cevap B) 10.',
  },
};

module.exports = {
  CURATED,
  PAGE_DIAGRAM_CROPS,
  IMAGE_SOURCE,
};
