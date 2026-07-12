/**
 * Egzersiz-özel soru içeriği (1–12). Soru bankasından bağımsız.
 * Her sınıf: 4 tip × 5 soru = 20; toplam 240.
 */

const PACK_ID = 'exercise-types-v1';
const OLD_PACK_IDS = ['grade1-exercise-types-ai-25', 'exercise-types-v1'];

const TYPE_LABELS = {
  'multiple-choice': 'Çoktan seçmeli',
  'true-false': 'Doğru / Yanlış',
  'fill-blank': 'Boşluk doldurma',
  matching: 'Eşleştirme',
};

const GRADE_META = {
  1: { topic: 'Sayılar ve örüntüler', outcome: 'Sayıları, örüntüleri ve temel işlemleri tanır.' },
  2: { topic: 'Toplama ve çıkarma', outcome: 'İki basamaklı sayılarla toplama-çıkarma yapar.' },
  3: { topic: 'Çarpma ve bölme', outcome: 'Çarpma ve bölme işlemlerini uygular.' },
  4: { topic: 'Kesirler ve ölçme', outcome: 'Basit kesirleri ve ölçü birimlerini kullanır.' },
  5: { topic: 'Kesirler ve ondalık', outcome: 'Kesir ve ondalık sayılarla işlem yapar.' },
  6: { topic: 'Oran ve yüzde', outcome: 'Oran, oranlama ve yüzde problemlerini çözer.' },
  7: { topic: 'Cebirsel ifadeler', outcome: 'Basit cebirsel ifadeleri sadeleştirir.' },
  8: { topic: 'Denklemler ve eşitsizlik', outcome: 'Birinci dereceden denklemleri çözer.' },
  9: { topic: 'Kümeler ve denklemler', outcome: 'Küme işlemleri ve doğrusal denklemleri kullanır.' },
  10: { topic: 'Fonksiyonlar', outcome: 'Fonksiyon kavramını ve grafiklerini yorumlar.' },
  11: { topic: 'Trigonometri ve dizi', outcome: 'Temel trigonometri ve dizi kavramlarını uygular.' },
  12: { topic: 'Limit ve türev giriş', outcome: 'Limit sezgisi ve türev yorumunu kullanır.' },
};

/** @type {Record<number, { mcq: Array, tf: Array, fill: Array, match: Array }>} */
const CONTENT = {
  1: {
    mcq: [
      ['2, 4, 6, __ örüntüsünde boşluğa hangisi gelir?', ['7', '8', '5', '9'], '8', 'Her adım +2; 6+2=8.'],
      ['3 + 4 işleminin sonucu nedir?', ['6', '7', '8', '5'], '7', '3 ile 4 toplamı 7.'],
      ['Hangisi çift sayıdır?', ['3', '5', '8', '9'], '8', '8, 2’ye tam bölünür.'],
      ['🔴 🔵 🔴 🔵 örüntüsünde sıradaki?', ['🔴', '🔵', '🟢', '🟡'], '🔴', 'Kural: kırmızı-mavi tekrar.'],
      ['10 − 3 = ?', ['6', '7', '8', '5'], '7', '10’dan 3 çıkarılırsa 7.'],
    ],
    tf: [
      ['2, 4, 6, 8 dizisi her adımda 2 artar.', 'Doğru', 'Fark sürekli +2.'],
      ['5 tek sayıdır.', 'Doğru', '5, 2’ye bölünmez.'],
      ['7 + 2 = 10.', 'Yanlış', '7+2=9.'],
      ['🔴 🔵 🔴 🔵 tekrarlayan bir örüntüdür.', 'Doğru', 'İki renk sırayla tekrar eder.'],
      ['1’den büyük en küçük sayı 0’dır.', 'Yanlış', '1’den büyük en küçük doğal sayı 2’dir.'],
    ],
    fill: [
      ['2, 4, 6, __', '8', 'Her adım +2.'],
      ['5 + 3 = __', '8', '5 ile 3 toplamı 8.'],
      ['9 − 4 = __', '5', '9’dan 4 çıkarılır.'],
      ['1, 3, 5, __', '7', 'Tek sayılar; +2.'],
      ['10, 9, 8, __', '7', 'Her adım −1.'],
    ],
    match: [
      {
        text: 'Sayıları özellikleriyle eşleştirin.',
        prompts: [
          { id: 'a', label: '2, 4, 6, 8' },
          { id: 'b', label: '1, 3, 5, 7' },
        ],
        options: ['Çift sayılar', 'Tek sayılar'],
        correctPairs: { a: 'Çift sayılar', b: 'Tek sayılar' },
      },
      {
        text: 'İşlemleri sonuçlarıyla eşleştirin.',
        prompts: [
          { id: 'a', label: '3 + 2' },
          { id: 'b', label: '8 − 3' },
        ],
        options: ['5', '5'],
        correctPairs: { a: '5', b: '5' },
      },
      {
        text: 'Örüntüleri türleriyle eşleştirin.',
        prompts: [
          { id: 'a', label: '🔴 🔵 🔴 🔵' },
          { id: 'b', label: '2, 4, 6, 8' },
        ],
        options: ['Renk örüntüsü', 'Artan sayı örüntüsü'],
        correctPairs: { a: 'Renk örüntüsü', b: 'Artan sayı örüntüsü' },
      },
      {
        text: 'Sayıları büyüklükleriyle eşleştirin.',
        prompts: [
          { id: 'a', label: '9' },
          { id: 'b', label: '2' },
        ],
        options: ['Daha büyük', 'Daha küçük'],
        correctPairs: { a: 'Daha büyük', b: 'Daha küçük' },
      },
      {
        text: 'İşlemleri türleriyle eşleştirin.',
        prompts: [
          { id: 'a', label: '4 + 1' },
          { id: 'b', label: '6 − 2' },
        ],
        options: ['Toplama', 'Çıkarma'],
        correctPairs: { a: 'Toplama', b: 'Çıkarma' },
      },
    ],
  },
  2: {
    mcq: [
      ['24 + 15 = ?', ['39', '38', '40', '29'], '39', '24+15=39.'],
      ['50 − 18 = ?', ['32', '42', '28', '38'], '32', '50−18=32.'],
      ['Hangisi 10’un katıdır?', ['25', '30', '33', '41'], '30', '30 = 3×10.'],
      ['17, 19, 21, __ sıradaki?', ['22', '23', '20', '24'], '23', 'Tek sayılar; +2.'],
      ['3 onluk + 4 birlik = ?', ['34', '43', '37', '7'], '34', '3×10+4=34.'],
    ],
    tf: [
      ['36 çift sayıdır.', 'Doğru', '36, 2’ye bölünür.'],
      ['45 − 20 = 25.', 'Doğru', '45−20=25.'],
      ['12 + 8 = 21.', 'Yanlış', '12+8=20.'],
      ['100’de 10 onluk vardır.', 'Doğru', '10×10=100.'],
      ['29, 30’dan büyüktür.', 'Yanlış', '29 < 30.'],
    ],
    fill: [
      ['25 + 14 = __', '39', '25+14=39.'],
      ['60 − 25 = __', '35', '60−25=35.'],
      ['10, 20, 30, __', '40', 'Her adım +10.'],
      ['5 onluk = __', '50', '5×10=50.'],
      ['48 − 9 = __', '39', '48−9=39.'],
    ],
    match: [
      {
        text: 'İşlemleri sonuçlarıyla eşleştirin.',
        prompts: [
          { id: 'a', label: '20 + 7' },
          { id: 'b', label: '40 − 5' },
        ],
        options: ['27', '35'],
        correctPairs: { a: '27', b: '35' },
      },
      {
        text: 'Sayıları basamaklarıyla eşleştirin.',
        prompts: [
          { id: 'a', label: '45' },
          { id: 'b', label: '70' },
        ],
        options: ['4 onluk 5 birlik', '7 onluk'],
        correctPairs: { a: '4 onluk 5 birlik', b: '7 onluk' },
      },
      {
        text: 'Örüntüleri kurallarıyla eşleştirin.',
        prompts: [
          { id: 'a', label: '5, 10, 15, 20' },
          { id: 'b', label: '20, 18, 16, 14' },
        ],
        options: ['+5 artan', '−2 azalan'],
        correctPairs: { a: '+5 artan', b: '−2 azalan' },
      },
      {
        text: 'Karşılaştırmaları eşleştirin.',
        prompts: [
          { id: 'a', label: '55 ? 48' },
          { id: 'b', label: '19 ? 31' },
        ],
        options: ['>', '<'],
        correctPairs: { a: '>', b: '<' },
      },
      {
        text: 'İşlem türlerini eşleştirin.',
        prompts: [
          { id: 'a', label: '33 + 12' },
          { id: 'b', label: '50 − 11' },
        ],
        options: ['Toplama', 'Çıkarma'],
        correctPairs: { a: 'Toplama', b: 'Çıkarma' },
      },
    ],
  },
  3: {
    mcq: [
      ['6 × 7 = ?', ['42', '36', '48', '40'], '42', '6×7=42.'],
      ['36 ÷ 4 = ?', ['8', '9', '6', '12'], '9', '36÷4=9.'],
      ['5 × 9 işleminin sonucu?', ['40', '45', '54', '35'], '45', '5×9=45.'],
      ['48 ÷ 6 = ?', ['6', '7', '8', '9'], '8', '48÷6=8.'],
      ['Hangisi 3’ün katıdır?', ['14', '22', '27', '25'], '27', '27=9×3.'],
    ],
    tf: [
      ['7 × 8 = 56.', 'Doğru', '7×8=56.'],
      ['45 ÷ 5 = 8.', 'Yanlış', '45÷5=9.'],
      ['0 ile çarpılan her sayı 0 olur.', 'Doğru', 'a×0=0.'],
      ['9 × 9 = 81.', 'Doğru', '9×9=81.'],
      ['20 ÷ 4 = 6.', 'Yanlış', '20÷4=5.'],
    ],
    fill: [
      ['8 × 6 = __', '48', '8×6=48.'],
      ['54 ÷ 9 = __', '6', '54÷9=6.'],
      ['7 × 5 = __', '35', '7×5=35.'],
      ['40 ÷ 5 = __', '8', '40÷5=8.'],
      ['3, 6, 9, 12, __', '15', '3’ün katları; +3.'],
    ],
    match: [
      {
        text: 'Çarpma işlemlerini sonuçlarıyla eşleştirin.',
        prompts: [
          { id: 'a', label: '4 × 9' },
          { id: 'b', label: '5 × 8' },
        ],
        options: ['36', '40'],
        correctPairs: { a: '36', b: '40' },
      },
      {
        text: 'Bölme işlemlerini sonuçlarıyla eşleştirin.',
        prompts: [
          { id: 'a', label: '42 ÷ 7' },
          { id: 'b', label: '63 ÷ 9' },
        ],
        options: ['6', '7'],
        correctPairs: { a: '6', b: '7' },
      },
      {
        text: 'İşlemleri türleriyle eşleştirin.',
        prompts: [
          { id: 'a', label: '6 × 3' },
          { id: 'b', label: '18 ÷ 3' },
        ],
        options: ['Çarpma', 'Bölme'],
        correctPairs: { a: 'Çarpma', b: 'Bölme' },
      },
      {
        text: 'Katları eşleştirin.',
        prompts: [
          { id: 'a', label: '4’ün katı' },
          { id: 'b', label: '5’in katı' },
        ],
        options: ['16', '25'],
        correctPairs: { a: '16', b: '25' },
      },
      {
        text: 'Örüntüleri kurallarıyla eşleştirin.',
        prompts: [
          { id: 'a', label: '4, 8, 12, 16' },
          { id: 'b', label: '50, 45, 40, 35' },
        ],
        options: ['+4 çarpım tablosu', '−5 azalan'],
        correctPairs: { a: '+4 çarpım tablosu', b: '−5 azalan' },
      },
    ],
  },
  4: {
    mcq: [
      ['1/2 ile 2/4 karşılaştırıldığında?', ['1/2 daha büyük', 'Eşittir', '2/4 daha büyük', 'Karşılaştırılamaz'], 'Eşittir', '2/4 sadeleşince 1/2.'],
      ['3/4 + 1/4 = ?', ['1', '1/2', '4/8', '2/4'], '1', 'Paylar toplanır: 4/4=1.'],
      ['1 metre kaç santimetredir?', ['10', '100', '1000', '50'], '100', '1 m = 100 cm.'],
      ['0,5 ondalık sayısı hangi kesre denktir?', ['1/5', '1/2', '5/10’den farklı', '2/5'], '1/2', '0,5 = 1/2.'],
      ['1 kg kaç gramdır?', ['100', '10', '1000', '500'], '1000', '1 kg = 1000 g.'],
    ],
    tf: [
      ['1/3, 1/2’den küçüktür.', 'Doğru', 'Payda büyüdükçe birim kesir küçülür.'],
      ['2/5 + 1/5 = 3/5.', 'Doğru', 'Paydalar aynı; paylar toplanır.'],
      ['1 saat 50 dakikadır.', 'Yanlış', '1 saat = 60 dakika.'],
      ['3/6 sadeleşince 1/2 olur.', 'Doğru', '3 ve 6, 3’e bölünür.'],
      ['0,25 = 1/4.', 'Doğru', '0,25 = 25/100 = 1/4.'],
    ],
    fill: [
      ['1/4 + 2/4 = __/4', '3', 'Paylar: 1+2=3.'],
      ['1 m = __ cm', '100', '1 metre = 100 cm.'],
      ['2/8 sadeleşince __/4', '1', '2 ve 8, 2’ye bölünür → 1/4.'],
      ['0,5 = __/2', '1', '0,5 = 1/2.'],
      ['1 kg = __ g', '1000', '1 kilogram = 1000 gram.'],
    ],
    match: [
      {
        text: 'Kesirleri ondalıklarla eşleştirin.',
        prompts: [
          { id: 'a', label: '1/2' },
          { id: 'b', label: '1/4' },
        ],
        options: ['0,5', '0,25'],
        correctPairs: { a: '0,5', b: '0,25' },
      },
      {
        text: 'Ölçü birimlerini eşleştirin.',
        prompts: [
          { id: 'a', label: '1 metre' },
          { id: 'b', label: '1 kilogram' },
        ],
        options: ['100 cm', '1000 g'],
        correctPairs: { a: '100 cm', b: '1000 g' },
      },
      {
        text: 'Kesir işlemlerini sonuçlarıyla eşleştirin.',
        prompts: [
          { id: 'a', label: '1/5 + 2/5' },
          { id: 'b', label: '3/4 − 1/4' },
        ],
        options: ['3/5', '2/4'],
        correctPairs: { a: '3/5', b: '2/4' },
      },
      {
        text: 'Eş kesirleri eşleştirin.',
        prompts: [
          { id: 'a', label: '2/4' },
          { id: 'b', label: '2/6' },
        ],
        options: ['1/2', '1/3'],
        correctPairs: { a: '1/2', b: '1/3' },
      },
      {
        text: 'Zaman birimlerini eşleştirin.',
        prompts: [
          { id: 'a', label: '1 saat' },
          { id: 'b', label: '1 gün' },
        ],
        options: ['60 dakika', '24 saat'],
        correctPairs: { a: '60 dakika', b: '24 saat' },
      },
    ],
  },
  5: {
    mcq: [
      ['2/3 + 1/6 = ?', ['5/6', '3/9', '1/2', '4/6'], '5/6', '2/3=4/6; 4/6+1/6=5/6.'],
      ['0,7 + 0,25 = ?', ['0,95', '0,9', '1,05', '0,325'], '0,95', '0,70+0,25=0,95.'],
      ['3/5’in ondalık karşılığı?', ['0,3', '0,5', '0,6', '0,35'], '0,6', '3÷5=0,6.'],
      ['1,2 × 3 = ?', ['3,6', '4,2', '2,4', '3,2'], '3,6', '1,2×3=3,6.'],
      ['4/10 sadeleşince?', ['2/5', '1/4', '4/5', '2/10'], '2/5', '2’ye bölünür.'],
    ],
    tf: [
      ['0,8 = 4/5.', 'Doğru', '0,8=8/10=4/5.'],
      ['1/2 + 1/3 = 2/5.', 'Yanlış', 'Ortak payda 6; 3/6+2/6=5/6.'],
      ['2,5 × 2 = 5.', 'Doğru', '2,5×2=5.'],
      ['7/10 > 0,65.', 'Doğru', '0,7 > 0,65.'],
      ['3 ÷ 4 = 0,75.', 'Doğru', '3/4=0,75.'],
    ],
    fill: [
      ['1/4 + 1/4 = __/4', '2', 'Paylar toplanır.'],
      ['0,3 + 0,4 = __', '0,7', '0,3+0,4=0,7.'],
      ['2/5 = 0,__', '4', '2÷5=0,4.'],
      ['1,5 × 2 = __', '3', '1,5×2=3.'],
      ['6/8 sadeleşince __/4', '3', '2’ye bölünür → 3/4.'],
    ],
    match: [
      {
        text: 'Kesir–ondalık eşleştirin.',
        prompts: [
          { id: 'a', label: '3/4' },
          { id: 'b', label: '1/5' },
        ],
        options: ['0,75', '0,2'],
        correctPairs: { a: '0,75', b: '0,2' },
      },
      {
        text: 'İşlemleri sonuçlarıyla eşleştirin.',
        prompts: [
          { id: 'a', label: '0,5 + 0,25' },
          { id: 'b', label: '1,2 − 0,4' },
        ],
        options: ['0,75', '0,8'],
        correctPairs: { a: '0,75', b: '0,8' },
      },
      {
        text: 'Sadeleşmiş halleri eşleştirin.',
        prompts: [
          { id: 'a', label: '6/9' },
          { id: 'b', label: '4/8' },
        ],
        options: ['2/3', '1/2'],
        correctPairs: { a: '2/3', b: '1/2' },
      },
      {
        text: 'Çarpımları eşleştirin.',
        prompts: [
          { id: 'a', label: '0,2 × 5' },
          { id: 'b', label: '1,5 × 4' },
        ],
        options: ['1', '6'],
        correctPairs: { a: '1', b: '6' },
      },
      {
        text: 'Karşılaştırmaları eşleştirin.',
        prompts: [
          { id: 'a', label: '0,6 ? 3/5' },
          { id: 'b', label: '1/4 ? 0,3' },
        ],
        options: ['=', '<'],
        correctPairs: { a: '=', b: '<' },
      },
    ],
  },
  6: {
    mcq: [
      ['12’nin %25’i kaçtır?', ['2', '3', '4', '6'], '3', '12×0,25=3.'],
      ['3 : 5 oranı 6 : ? ile orantılıdır.', ['8', '10', '9', '15'], '10', '3/5=6/10.'],
      ['40’ın %10’u?', ['4', '5', '8', '10'], '4', '40×0,1=4.'],
      ['2/5 oranı yüzde kaçtır?', ['25', '40', '20', '50'], '40', '2/5=0,4=%40.'],
      ['15 : 3 sadeleşince?', ['5 : 1', '3 : 1', '15 : 1', '5 : 3'], '5 : 1', '3’e bölünür.'],
    ],
    tf: [
      ['%50, yarısı demektir.', 'Doğru', '%50 = 1/2.'],
      ['4 : 8 ile 1 : 2 aynı orandır.', 'Doğru', '4/8=1/2.'],
      ['20’nin %30’u 8’dir.', 'Yanlış', '20×0,3=6.'],
      ['Oran a:b, a/b kesrine denktir.', 'Doğru', 'Tanım gereği.'],
      ['%100 bir bütünü gösterir.', 'Doğru', '%100 = 1.'],
    ],
    fill: [
      ['50’nin %20’si = __', '10', '50×0,2=10.'],
      ['4 : 6 = 2 : __', '3', '2’ye bölünür.'],
      ['%25 = __/4', '1', '%25=1/4.'],
      ['8’in %50’si = __', '4', '8×0,5=4.'],
      ['3/10 = %__', '30', '0,3=%30.'],
    ],
    match: [
      {
        text: 'Yüzdeleri kesirlerle eşleştirin.',
        prompts: [
          { id: 'a', label: '%25' },
          { id: 'b', label: '%75' },
        ],
        options: ['1/4', '3/4'],
        correctPairs: { a: '1/4', b: '3/4' },
      },
      {
        text: 'Oranları sade halleriyle eşleştirin.',
        prompts: [
          { id: 'a', label: '6 : 9' },
          { id: 'b', label: '10 : 5' },
        ],
        options: ['2 : 3', '2 : 1'],
        correctPairs: { a: '2 : 3', b: '2 : 1' },
      },
      {
        text: 'Yüzde hesaplarını eşleştirin.',
        prompts: [
          { id: 'a', label: '80’in %10’u' },
          { id: 'b', label: '60’ın %50’si' },
        ],
        options: ['8', '30'],
        correctPairs: { a: '8', b: '30' },
      },
      {
        text: 'Orantıları eşleştirin.',
        prompts: [
          { id: 'a', label: '2 : 3 = 4 : ?' },
          { id: 'b', label: '5 : 1 = 10 : ?' },
        ],
        options: ['6', '2'],
        correctPairs: { a: '6', b: '2' },
      },
      {
        text: 'Kesir–yüzde eşleştirin.',
        prompts: [
          { id: 'a', label: '1/5' },
          { id: 'b', label: '3/5' },
        ],
        options: ['%20', '%60'],
        correctPairs: { a: '%20', b: '%60' },
      },
    ],
  },
  7: {
    mcq: [
      ['3x + 2x ifadesinin sade hali?', ['5x', '6x', '5x²', 'x'], '5x', 'Benzer terimler toplanır.'],
      ['x = 4 için 2x + 1 = ?', ['7', '8', '9', '6'], '9', '2·4+1=9.'],
      ['5(a + 2) açılımı?', ['5a + 2', '5a + 10', 'a + 10', '5a + 7'], '5a + 10', 'Dağıtma: 5a+10.'],
      ['−3x + 7x = ?', ['4x', '−10x', '10x', '4'], '4x', '−3+7=4.'],
      ['2x − x + 3 ifadesinde x’in katsayısı?', ['1', '2', '3', '0'], '1', '2x−x=x.'],
    ],
    tf: [
      ['2x + 3x = 5x.', 'Doğru', 'Benzer terimler.'],
      ['x · x = 2x.', 'Yanlış', 'x·x = x².'],
      ['4(x − 1) = 4x − 4.', 'Doğru', 'Dağıtma özelliği.'],
      ['Sabit terim x içermez.', 'Doğru', 'Tanım.'],
      ['3x − 3x = 3.', 'Yanlış', '3x−3x=0.'],
    ],
    fill: [
      ['4x + x = __x', '5', '4+1=5.'],
      ['x=3 için x+5 = __', '8', '3+5=8.'],
      ['2(x+4) = 2x + __', '8', '2·4=8.'],
      ['7y − 2y = __y', '5', '7−2=5.'],
      ['x² ifadesinde üs __', '2', 'Kare demek üs 2.'],
    ],
    match: [
      {
        text: 'İfadeleri sade halleriyle eşleştirin.',
        prompts: [
          { id: 'a', label: 'x + x + x' },
          { id: 'b', label: '5a − 2a' },
        ],
        options: ['3x', '3a'],
        correctPairs: { a: '3x', b: '3a' },
      },
      {
        text: 'Açılımları eşleştirin.',
        prompts: [
          { id: 'a', label: '3(x + 1)' },
          { id: 'b', label: '2(y − 5)' },
        ],
        options: ['3x + 3', '2y − 10'],
        correctPairs: { a: '3x + 3', b: '2y − 10' },
      },
      {
        text: 'Değerleri eşleştirin (x=2).',
        prompts: [
          { id: 'a', label: '3x' },
          { id: 'b', label: 'x + 7' },
        ],
        options: ['6', '9'],
        correctPairs: { a: '6', b: '9' },
      },
      {
        text: 'Terim türlerini eşleştirin.',
        prompts: [
          { id: 'a', label: '5x' },
          { id: 'b', label: '12' },
        ],
        options: ['Değişkenli terim', 'Sabit terim'],
        correctPairs: { a: 'Değişkenli terim', b: 'Sabit terim' },
      },
      {
        text: 'Çarpımları eşleştirin.',
        prompts: [
          { id: 'a', label: 'x · x' },
          { id: 'b', label: '2 · 2x' },
        ],
        options: ['x²', '4x'],
        correctPairs: { a: 'x²', b: '4x' },
      },
    ],
  },
  8: {
    mcq: [
      ['2x + 4 = 10 denkleminde x = ?', ['2', '3', '4', '5'], '3', '2x=6 → x=3.'],
      ['x − 5 = 2 ise x = ?', ['3', '7', '−3', '10'], '7', 'x=2+5=7.'],
      ['3x = 12 ise x = ?', ['3', '4', '6', '9'], '4', 'x=12/3=4.'],
      ['x/2 = 5 ise x = ?', ['2,5', '10', '7', '5'], '10', 'x=5·2=10.'],
      ['x + 3 < 7 eşitsizliğinde x’in bir çözümü?', ['5', '4', '3', '2'], '3', '3+3=6<7; 4+3=7 değil.'],
    ],
    tf: [
      ['x + 1 = 4 ise x = 3.', 'Doğru', 'x=4−1=3.'],
      ['5x = 0 ise x = 5.', 'Yanlış', 'x=0.'],
      ['Eşitliğin her iki tarafına aynı sayı eklenebilir.', 'Doğru', 'Denklem özelliği.'],
      ['2x − 2 = 0 ise x = 1.', 'Doğru', '2x=2 → x=1.'],
      ['x > 3 ise x = 3 çözümdür.', 'Yanlış', '3 > 3 yanlış.'],
    ],
    fill: [
      ['x + 6 = 10 → x = __', '4', 'x=10−6.'],
      ['4x = 20 → x = __', '5', 'x=20/4.'],
      ['x − 8 = 0 → x = __', '8', 'x=8.'],
      ['x/3 = 4 → x = __', '12', 'x=12.'],
      ['2x + 1 = 9 → x = __', '4', '2x=8 → x=4.'],
    ],
    match: [
      {
        text: 'Denklemleri çözümleriyle eşleştirin.',
        prompts: [
          { id: 'a', label: 'x + 2 = 9' },
          { id: 'b', label: '3x = 15' },
        ],
        options: ['x = 7', 'x = 5'],
        correctPairs: { a: 'x = 7', b: 'x = 5' },
      },
      {
        text: 'İşlem adımlarını eşleştirin.',
        prompts: [
          { id: 'a', label: 'x − 4 = 1' },
          { id: 'b', label: 'x/5 = 2' },
        ],
        options: ['Her iki tarafa +4', 'Her iki tarafı ×5'],
        correctPairs: { a: 'Her iki tarafa +4', b: 'Her iki tarafı ×5' },
      },
      {
        text: 'Eşitsizlikleri doğrulukla eşleştirin (x=2).',
        prompts: [
          { id: 'a', label: 'x < 5' },
          { id: 'b', label: 'x > 4' },
        ],
        options: ['Doğru', 'Yanlış'],
        correctPairs: { a: 'Doğru', b: 'Yanlış' },
      },
      {
        text: 'Çözümleri eşleştirin.',
        prompts: [
          { id: 'a', label: '5x = 0' },
          { id: 'b', label: 'x + 0 = 6' },
        ],
        options: ['x = 0', 'x = 6'],
        correctPairs: { a: 'x = 0', b: 'x = 6' },
      },
      {
        text: 'Denklem türlerini eşleştirin.',
        prompts: [
          { id: 'a', label: '2x + 1 = 5' },
          { id: 'b', label: 'x > 1' },
        ],
        options: ['Denklem', 'Eşitsizlik'],
        correctPairs: { a: 'Denklem', b: 'Eşitsizlik' },
      },
    ],
  },
  9: {
    mcq: [
      ['A = {1,2,3}, B = {3,4} için A ∩ B = ?', ['{1,2,3,4}', '{3}', '{1,2}', '∅'], '{3}', 'Ortak eleman 3.'],
      ['A ∪ B’de A={1}, B={2} ise?', ['{1}', '{2}', '{1,2}', '∅'], '{1,2}', 'Birleşim tüm elemanlar.'],
      ['2x − 6 = 0 ise x = ?', ['2', '3', '−3', '6'], '3', '2x=6 → x=3.'],
      ['Doğru orantıda y = kx ise k’ye ne denir?', ['Sabit', 'Oran katsayısı', 'Kök', 'Üs'], 'Oran katsayısı', 'Doğrusal oran sabiti.'],
      ['∅ kümesinin eleman sayısı?', ['1', '0', 'sonsuz', 'tanımsız'], '0', 'Boş küme.'],
    ],
    tf: [
      ['A ⊆ A her zaman doğrudur.', 'Doğru', 'Her küme kendisinin alt kümesidir.'],
      ['A ∩ ∅ = A.', 'Yanlış', 'A ∩ ∅ = ∅.'],
      ['x + 2 = 2x denkleminde x = 2.', 'Doğru', '2=2x−x → x=2.'],
      ['Birleşimde ortak eleman iki kez yazılır.', 'Yanlış', 'Kümede tekrar yok.'],
      ['{1,2} ⊂ {1,2,3}.', 'Doğru', 'Asıl alt küme.'],
    ],
    fill: [
      ['A={a,b}, B={b,c} → A ∩ B = {__}', 'b', 'Ortak eleman b.'],
      ['3x = 21 → x = __', '7', 'x=7.'],
      ['A ∪ ∅ = __', 'A', 'Birleşim A.’dır.'],
      ['x − 4 = 5 → x = __', '9', 'x=9.'],
      ['|{1,1,2}| = __ (küme)', '2', 'Tekrar sayılmaz; {1,2}.'],
    ],
    match: [
      {
        text: 'Küme işlemlerini sonuçlarıyla eşleştirin (A={1,2}, B={2,3}).',
        prompts: [
          { id: 'a', label: 'A ∩ B' },
          { id: 'b', label: 'A ∪ B' },
        ],
        options: ['{2}', '{1,2,3}'],
        correctPairs: { a: '{2}', b: '{1,2,3}' },
      },
      {
        text: 'Denklemleri çözümleriyle eşleştirin.',
        prompts: [
          { id: 'a', label: 'x/2 = 6' },
          { id: 'b', label: 'x + 9 = 9' },
        ],
        options: ['x = 12', 'x = 0'],
        correctPairs: { a: 'x = 12', b: 'x = 0' },
      },
      {
        text: 'Kavramları eşleştirin.',
        prompts: [
          { id: 'a', label: '∅' },
          { id: 'b', label: 'A ∩ B' },
        ],
        options: ['Boş küme', 'Kesişim'],
        correctPairs: { a: 'Boş küme', b: 'Kesişim' },
      },
      {
        text: 'Alt küme ilişkilerini eşleştirin.',
        prompts: [
          { id: 'a', label: '{1} ? {1,2}' },
          { id: 'b', label: '{1,2} ? {1}' },
        ],
        options: ['⊂', '⊄'],
        correctPairs: { a: '⊂', b: '⊄' },
      },
      {
        text: 'Doğrusal ifadeleri eşleştirin.',
        prompts: [
          { id: 'a', label: 'y = 2x' },
          { id: 'b', label: 'y = x²' },
        ],
        options: ['Doğru orantı', 'Doğrusal değil'],
        correctPairs: { a: 'Doğru orantı', b: 'Doğrusal değil' },
      },
    ],
  },
  10: {
    mcq: [
      ['f(x)=2x+1 için f(3)=?', ['5', '6', '7', '8'], '7', '2·3+1=7.'],
      ['f(x)=x² için f(−2)=?', ['−4', '4', '2', '−2'], '4', '(−2)²=4.'],
      ['Bir fonksiyonun tanım kümesi neyi gösterir?', ['Çıktı değerleri', 'Girdi değerleri', 'Eğim', 'Kök'], 'Girdi değerleri', 'Tanım kümesi domain.'],
      ['f(x)=5 sabit fonksiyonunda f(10)=?', ['10', '5', '0', '50'], '5', 'Sabit fonksiyon.'],
      ['f(x)=x−4=0 ise x=?', ['4', '−4', '0', '1'], '4', 'Kök x=4.'],
    ],
    tf: [
      ['f(x)=3x doğrusal bir fonksiyondur.', 'Doğru', 'Birinci dereceden.'],
      ['f(2)=f(3) her fonksiyon için doğrudur.', 'Yanlış', 'Genelde farklıdır.'],
      ['Sabit fonksiyonda tüm girdiler aynı çıktıyı verir.', 'Doğru', 'Tanım.'],
      ['f(x)=x² için f(−1)=−1.', 'Yanlış', '(−1)²=1.'],
      ['Grafikte x ekseni girdi eksenidir.', 'Doğru', 'Yatay eksen.'],
    ],
    fill: [
      ['f(x)=x+5 → f(0)=__', '5', '0+5=5.'],
      ['f(x)=3x → f(4)=__', '12', '3·4=12.'],
      ['f(x)=x² → f(5)=__', '25', '5²=25.'],
      ['f(x)=7 → f(100)=__', '7', 'Sabit.'],
      ['f(x)=2x−1=0 → x=__', '1/2', '2x=1 → x=1/2.'],
    ],
    match: [
      {
        text: 'Fonksiyon değerlerini eşleştirin (f(x)=2x).',
        prompts: [
          { id: 'a', label: 'f(1)' },
          { id: 'b', label: 'f(5)' },
        ],
        options: ['2', '10'],
        correctPairs: { a: '2', b: '10' },
      },
      {
        text: 'Fonksiyon türlerini eşleştirin.',
        prompts: [
          { id: 'a', label: 'f(x)=4' },
          { id: 'b', label: 'f(x)=x+1' },
        ],
        options: ['Sabit', 'Doğrusal'],
        correctPairs: { a: 'Sabit', b: 'Doğrusal' },
      },
      {
        text: 'Kümeleri eşleştirin.',
        prompts: [
          { id: 'a', label: 'Tanım kümesi' },
          { id: 'b', label: 'Görüntü kümesi' },
        ],
        options: ['Girdiler', 'Çıktılar'],
        correctPairs: { a: 'Girdiler', b: 'Çıktılar' },
      },
      {
        text: 'f(x)=x² değerlerini eşleştirin.',
        prompts: [
          { id: 'a', label: 'f(0)' },
          { id: 'b', label: 'f(−3)' },
        ],
        options: ['0', '9'],
        correctPairs: { a: '0', b: '9' },
      },
      {
        text: 'Denklem–kök eşleştirin.',
        prompts: [
          { id: 'a', label: 'f(x)=x−2=0' },
          { id: 'b', label: 'f(x)=2x=0' },
        ],
        options: ['x=2', 'x=0'],
        correctPairs: { a: 'x=2', b: 'x=0' },
      },
    ],
  },
  11: {
    mcq: [
      ['sin(90°) = ?', ['0', '1', '1/2', '√2/2'], '1', 'sin 90° = 1.'],
      ['cos(0°) = ?', ['0', '1', '−1', '1/2'], '1', 'cos 0° = 1.'],
      ['2, 4, 6, 8 dizisinin ortak farkı?', ['1', '2', '4', '0'], '2', 'Aritmetik dizi; d=2.'],
      ['tan(45°) = ?', ['0', '1', '√3', 'tanımsız'], '1', 'tan 45° = 1.'],
      ['3, 6, 12, 24 dizisi hangi tür?', ['Aritmetik', 'Geometrik', 'Sabit', 'Fibonacci'], 'Geometrik', 'Ortak çarpan 2.'],
    ],
    tf: [
      ['sin(0°)=0.', 'Doğru', 'Standart değer.'],
      ['cos(90°)=1.', 'Yanlış', 'cos 90°=0.'],
      ['Aritmetik dizide ortak fark sabittir.', 'Doğru', 'Tanım.'],
      ['Geometrik dizide ortak oran sabittir.', 'Doğru', 'Tanım.'],
      ['tan(0°)=1.', 'Yanlış', 'tan 0°=0.'],
    ],
    fill: [
      ['sin(30°)=1/__', '2', 'sin 30°=1/2.'],
      ['cos(60°)=1/__', '2', 'cos 60°=1/2.'],
      ['5, 8, 11, 14 → ortak fark __', '3', 'd=3.'],
      ['2, 6, 18, 54 → ortak oran __', '3', 'r=3.'],
      ['tan(45°)=__', '1', 'tan 45°=1.'],
    ],
    match: [
      {
        text: 'Trigonometrik değerleri eşleştirin.',
        prompts: [
          { id: 'a', label: 'sin 90°' },
          { id: 'b', label: 'cos 90°' },
        ],
        options: ['1', '0'],
        correctPairs: { a: '1', b: '0' },
      },
      {
        text: 'Dizi türlerini eşleştirin.',
        prompts: [
          { id: 'a', label: '1, 4, 7, 10' },
          { id: 'b', label: '1, 2, 4, 8' },
        ],
        options: ['Aritmetik', 'Geometrik'],
        correctPairs: { a: 'Aritmetik', b: 'Geometrik' },
      },
      {
        text: 'Açı–değer eşleştirin.',
        prompts: [
          { id: 'a', label: 'sin 0°' },
          { id: 'b', label: 'tan 45°' },
        ],
        options: ['0', '1'],
        correctPairs: { a: '0', b: '1' },
      },
      {
        text: 'Ortak fark/oran eşleştirin.',
        prompts: [
          { id: 'a', label: '10, 7, 4, 1' },
          { id: 'b', label: '81, 27, 9, 3' },
        ],
        options: ['d = −3', 'r = 1/3'],
        correctPairs: { a: 'd = −3', b: 'r = 1/3' },
      },
      {
        text: 'Kimlikleri eşleştirin.',
        prompts: [
          { id: 'a', label: 'sin²θ + cos²θ' },
          { id: 'b', label: 'tan θ' },
        ],
        options: ['1', 'sinθ/cosθ'],
        correctPairs: { a: '1', b: 'sinθ/cosθ' },
      },
    ],
  },
  12: {
    mcq: [
      ['lim(x→2) (x+3) = ?', ['2', '3', '5', '6'], '5', 'Sürekli; 2+3=5.'],
      ['f(x)=x² türevi f′(x)=?', ['x', '2x', '2', 'x²'], '2x', 'Üs kuralı.'],
      ['lim(x→0) 5 = ?', ['0', '5', 'tanımsız', '1'], '5', 'Sabit fonksiyon limiti.'],
      ['f(x)=3x+1 için f′(x)=?', ['3x', '3', '1', '0'], '3', 'Doğrunun eğimi.'],
      ['Türev bir noktada neyi verir?', ['Alan', 'Anlık değişim oranı', 'Ortalama', 'Kök'], 'Anlık değişim oranı', 'Geometrik: eğim.'],
    ],
    tf: [
      ['Sabit fonksiyonun türevi 0’dır.', 'Doğru', '(c)′=0.'],
      ['lim(x→1) x = 0.', 'Yanlış', 'Limit 1.’dir.'],
      ['f(x)=x³ için f′(x)=3x².', 'Doğru', 'Üs kuralı.'],
      ['Süreklilik limitin varlığını gerektirir (o noktada).', 'Doğru', 'Temel teorem.'],
      ['Türev her zaman pozitiftir.', 'Yanlış', 'Azalan fonksiyonlarda negatif olabilir.'],
    ],
    fill: [
      ['lim(x→0) (x+4) = __', '4', '0+4=4.'],
      ['f(x)=x → f′(x)=__', '1', 'Doğrunun eğimi 1.'],
      ['f(x)=7 → f′(x)=__', '0', 'Sabit.'],
      ['lim(x→3) 2x = __', '6', '2·3=6.'],
      ['f(x)=x² → f′(2)=__', '4', 'f′=2x; 2·2=4.'],
    ],
    match: [
      {
        text: 'Limitleri eşleştirin.',
        prompts: [
          { id: 'a', label: 'lim(x→1) (2x)' },
          { id: 'b', label: 'lim(x→0) 9' },
        ],
        options: ['2', '9'],
        correctPairs: { a: '2', b: '9' },
      },
      {
        text: 'Türevleri eşleştirin.',
        prompts: [
          { id: 'a', label: 'f(x)=5x' },
          { id: 'b', label: 'f(x)=x²' },
        ],
        options: ['f′=5', 'f′=2x'],
        correctPairs: { a: 'f′=5', b: 'f′=2x' },
      },
      {
        text: 'Kavramları eşleştirin.',
        prompts: [
          { id: 'a', label: 'Limit' },
          { id: 'b', label: 'Türev' },
        ],
        options: ['Yaklaşma değeri', 'Anlık eğim'],
        correctPairs: { a: 'Yaklaşma değeri', b: 'Anlık eğim' },
      },
      {
        text: 'f′(x) değerlerini eşleştirin (f(x)=x²).',
        prompts: [
          { id: 'a', label: 'f′(0)' },
          { id: 'b', label: 'f′(3)' },
        ],
        options: ['0', '6'],
        correctPairs: { a: '0', b: '6' },
      },
      {
        text: 'Kuralları eşleştirin.',
        prompts: [
          { id: 'a', label: '(c)\'' },
          { id: 'b', label: '(xⁿ)\'' },
        ],
        options: ['0', 'n xⁿ⁻¹'],
        correctPairs: { a: '0', b: 'n xⁿ⁻¹' },
      },
    ],
  },
};

// Fix grade 1 matching item 2 which has duplicate options - matching needs unique options typically
CONTENT[1].match[1] = {
  text: 'İşlemleri sonuçlarıyla eşleştirin.',
  prompts: [
    { id: 'a', label: '4 + 1' },
    { id: 'b', label: '9 − 2' },
  ],
  options: ['5', '7'],
  correctPairs: { a: '5', b: '7' },
};

function classLevel(grade) {
  return `${grade}. Sınıf`;
}

function baseDoc(grade, extra) {
  const meta = GRADE_META[grade];
  return {
    subject: 'Matematik',
    topic: meta.topic,
    classLevel: classLevel(grade),
    difficulty: grade <= 4 ? 'Kolay' : grade <= 8 ? 'Orta' : 'Zor',
    source: 'exercise-seed',
    learningOutcome: meta.outcome,
    mebReference: `MEB Matematik — ${grade}. sınıf`,
    assessmentMeta: { packId: PACK_ID, generator: 'seed-exercise-types-v1' },
    ...extra,
  };
}

function buildGradeQuestions(grade) {
  const c = CONTENT[grade];
  if (!c) throw new Error(`No content for grade ${grade}`);

  const mcq = c.mcq.map(([text, opts, correct, solution], i) =>
    baseDoc(grade, {
      text,
      type: 'multiple-choice',
      interactiveType: 'none',
      options: opts.map((t) => ({ text: t })),
      correctAnswer: correct,
      solution,
      assessmentMeta: { packId: PACK_ID, code: `G${grade}-MC-${i + 1}` },
    }),
  );

  const tf = c.tf.map(([text, correct, solution], i) =>
    baseDoc(grade, {
      text,
      type: 'true-false',
      interactiveType: 'none',
      options: [{ text: 'Doğru' }, { text: 'Yanlış' }],
      correctAnswer: correct,
      solution,
      assessmentMeta: { packId: PACK_ID, code: `G${grade}-TF-${i + 1}` },
    }),
  );

  const fill = c.fill.map(([text, correct, solution], i) =>
    baseDoc(grade, {
      text,
      type: 'fill-blank',
      interactiveType: 'none',
      options: [],
      correctAnswer: correct,
      solution,
      assessmentMeta: { packId: PACK_ID, code: `G${grade}-FB-${i + 1}` },
    }),
  );

  const match = c.match.map((set, i) =>
    baseDoc(grade, {
      text: set.text,
      type: 'matching',
      interactiveType: 'matching',
      interactionData: {
        prompts: set.prompts,
        options: set.options,
        correctPairs: set.correctPairs,
      },
      options: [],
      correctAnswer: '__interactive_matching__',
      solution: `Eşleştirmeler: ${Object.entries(set.correctPairs)
        .map(([k, v]) => `${k}→${v}`)
        .join(', ')}`,
      assessmentMeta: { packId: PACK_ID, code: `G${grade}-MT-${i + 1}` },
    }),
  );

  return [...mcq, ...tf, ...fill, ...match];
}

function buildAllQuestions() {
  const all = [];
  for (let g = 1; g <= 12; g += 1) {
    all.push(...buildGradeQuestions(g));
  }
  return all;
}

module.exports = {
  PACK_ID,
  OLD_PACK_IDS,
  TYPE_LABELS,
  GRADE_META,
  buildGradeQuestions,
  buildAllQuestions,
  classLevel,
};
