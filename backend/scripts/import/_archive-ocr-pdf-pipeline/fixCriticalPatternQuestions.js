/**
 * Kırpma/OCR hatası kalan kritik sorular için hedefli düzeltme.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Question = require('../../models/Question');

const FIXES = [
  {
    classLevel: '5. Sınıf',
    sequenceIndex: 3,
    text: '15 — 19 — 23 — 25 — 27 — 31 sayı dizisinin bir örüntü oluşturması için hangi sayı çıkarılmalıdır?',
    options: ['15', '23', '25', '31'],
    correctAnswer: '25',
    solution: '1. Dizideki artışlara bakın: 15→19 (+4), 19→23 (+4), 23→25 (+2) düzensiz.\n2. 25 çıkarılırsa 15, 19, 23, 27, 31 kalır; 23→27→31 (+4).\n3. Doğru cevap C) 25 şıkkıdır.',
  },
  {
    classLevel: '5. Sınıf',
    sequenceIndex: 6,
    text: 'Renkleri farklı kartonlardan kesilen üçgen ve dairelerle oluşturulan şekil örüntüsünün 4. adımında kaç adet üçgen vardır?',
    options: ['4', '5', '6', '7'],
    correctAnswer: '4',
    solution: '1. Her adımda üçgen sayısındaki artış kuralını inceleyin.\n2. 4. adım için kuralı uygulayın.\n3. Doğru cevap 4 adet üçgendir.',
  },
  {
    classLevel: '5. Sınıf',
    sequenceIndex: 15,
    text: 'Şekil örüntüsünün çevre uzunluğunu adım sayısına göre veren kural aşağıdakilerden hangisi olabilir? (Görsele bakınız.)',
    options: ['3 × (Adım Sayısı)', '2 × (Adım Sayısı) + 1', '5 × (Adım Sayısı) − 2', '4 × (Adım Sayısı) + 2'],
    correctAnswer: '2 × (Adım Sayısı) + 1',
    solution: '1. Görseldeki örüntüde çevre artışını inceleyin.\n2. n. adım için çevre ifadesini bulun.\n3. Doğru kuralı şıklardan seçin.',
  },
  {
    classLevel: '5. Sınıf',
    sequenceIndex: 19,
    text: 'Derin, renkleri farklı kartonlardan üçgen ve daire keserek ilk üç adımı görselde verilen şekil örüntüsünü oluşturmuştur. Buna göre 4. adımda kaç adet üçgen vardır?',
    options: ['4', '5', '6', '7'],
    correctAnswer: '5',
    solution: '1. Her adımda üçgen sayısındaki artış kuralını inceleyin.\n2. 4. adım için kuralı uygulayın.\n3. Doğru şık 5 adet üçgendir.',
  },
  {
    classLevel: '5. Sınıf',
    sequenceIndex: 20,
    text: 'Kibrit çöpleri ile oluşturulan bir şekil örüntüsünün ilk üç adımı görselde verilmiştir. Buna göre bu örüntü ile ilgili aşağıdakilerden hangisi yanlıştır?',
    options: [
      'Örüntüdeki kibrit çöpü sayısını veren kural "4 × (Adım Sayısı) + 1" dir.',
      'Örüntünün 6. adımında kullanılan kibrit çöpü sayısı bir doğal sayının karesine eşittir.',
      'Örüntünün ilk beş adımını oluşturmak için 65 kibrit çöpü kullanılır.',
      'Her adımda bir önceki adıma göre kibrit çöpü sayısı beşer beşer artmıştır.',
    ],
    correctAnswer: 'Her adımda bir önceki adıma göre kibrit çöpü sayısı beşer beşer artmıştır.',
    solution: '1. Görselden kibrit çöpü kuralını çıkarın.\n2. Her ifadeyi kontrol edin.\n3. Yanlış olanı seçin.',
  },
  {
    classLevel: '7. Sınıf',
    sequenceIndex: 6,
    text: 'Özdeş karelerle oluşturulan bir örüntünün ilk üç adımı verilmiştir. Buna göre 4. adımda kaç adet kare kullanılır?',
    options: ['16', '17', '19', '21'],
    correctAnswer: '19',
    solution: '1. Kare sayısındaki artış kuralını bulun.\n2. 4. adım için kuralı uygulayın.\n3. Doğru cevap 19 şıkkıdır.',
  },
  {
    classLevel: '7. Sınıf',
    sequenceIndex: 8,
    text: 'Dört farklı örüntünün genel kuralı aşağıda verilmiştir. Buna göre hangi örüntünün 10. terimi en büyüktür?',
    options: ['2n + 1', '3n − 2', 'n² + 1', '4n − 3'],
    correctAnswer: 'n² + 1',
    solution: '1. Her kural için n = 10 yerine koyun.\n2. Sonuçları karşılaştırın.\n3. En büyük değeri veren kuralı seçin.',
  },
  {
    classLevel: '7. Sınıf',
    sequenceIndex: 9,
    text: 'Kibrit çöpleri ile oluşturulan bir örüntünün ilk üç adımı verilmiştir. Buna göre 24. adımda kaç kibrit çöpü kullanılır?',
    options: ['66', '70', '80', '88'],
    correctAnswer: '70',
    solution: '1. Kibrit çöpü sayısındaki artış kuralını belirleyin.\n2. n = 24 için kuralı uygulayın.\n3. Doğru cevap B) 70 şıkkıdır.',
  },
  {
    classLevel: '9. Sınıf',
    sequenceIndex: 12,
    text: 'Bir örüntüde her adımda belirli sayıda birim eklenmektedir. Verilen tabloya göre eksik değeri bulunuz.',
    options: ['28', '32', '36', '40', '44'],
    correctAnswer: '44',
    answerLetter: 'E',
    solution: '1. Tablodaki artış miktarını belirleyin.\n2. Eksik terimi hesaplayın.\n3. Doğru cevap E) 44 şıkkıdır.',
  },
  {
    classLevel: '9. Sınıf',
    sequenceIndex: 15,
    text: 'Bir çaycı, çayları belirli aralıklarla dağıtıp yeni çaylar almak için çay evine dönmekte ve dağıtıma aynı şekilde devam etmektedir. Yürüyüş yolu üzerindeki kırılma noktalarına göre toplam mesafeyi hesaplayınız.',
    options: ['1600', '3690', '4840', '5760', '6120'],
    correctAnswer: '4840',
    answerLetter: 'C',
    solution: '1. Her turda kat edilen mesafeyi modelleyin.\n2. Toplam mesafeyi hesaplayın.\n3. Doğru cevap C) 4840 şıkkıdır.',
  },
  {
    classLevel: '9. Sınıf',
    sequenceIndex: 19,
    text: 'Blokların boşluğa düşmesi için (n − 1). sütunda dikey konumda bulunması gerektiği göz önünde bulundurulduğunda n sayısı aşağıdakilerden hangisi olabilir?',
    options: ['119', '101', '83', '72', '59'],
    correctAnswer: '72',
    answerLetter: 'D',
    solution: '1. Dikey konum koşulunu denklem olarak yazın.\n2. n için uygun değeri bulun.\n3. Doğru cevap D) 72 şıkkıdır.',
  },
  {
    classLevel: '9. Sınıf',
    sequenceIndex: 1,
    text: 'İki ayrı şirketteki hiyerarşi şeması verilmiştir. Kazanım sorularından oluşan bir matematik soru kitabı yazmak isteyen Gürsel her gün bir önceki günden 4 soru daha fazla yazmaktadır. Buna göre soruyu cevaplayınız.',
    options: ['1020', '1044', '1071', '8', '12'],
    correctAnswer: '1044',
    answerLetter: 'B',
    solution: '1. Günlük artış miktarını (+4) belirleyin.\n2. İstenen gün için toplam soru sayısını hesaplayın.\n3. Doğru cevap B) 1044 şıkkıdır.',
  },
  {
    classLevel: '9. Sınıf',
    sequenceIndex: 6,
    text: 'Bir hareketlinin doğru aldığı toplam yolun sağa doğru aldığı toplam yola oranı sorulmaktadır.',
    options: ['>', '1', '2', '4', '8'],
    correctAnswer: '1',
    answerLetter: 'B',
    solution: '1. Yol bileşenlerini modelleyin.\n2. Oranı hesaplayın.\n3. Doğru cevap B) 1 şıkkıdır.',
  },
  {
    classLevel: '9. Sınıf',
    sequenceIndex: 10,
    text: 'Uzunluklarına sahip iki eş kare ve üç eş kareden oluşan kitaplıkların genişlikleri sırasıyla 60 cm ve 85 cm\'dir. Soru işaretli kısma gelmesi gereken şekil aşağıdakilerden hangisidir?',
    options: ['260', '265', '270', '275', '280'],
    correctAnswer: '270',
    answerLetter: 'C',
    solution: '1. Genişlik farkından kuralı bulun.\n2. Eksik parçayı belirleyin.\n3. Doğru cevap C) 270 şıkkıdır.',
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });
  let updated = 0;
  for (const fix of FIXES) {
    const res = await Question.updateOne(
      {
        classLevel: fix.classLevel,
        'assessmentMeta.sequenceIndex': fix.sequenceIndex,
        'assessmentMeta.importSource': 'pattern-pdf-pack',
      },
      {
        $set: {
          text: fix.text,
          options: fix.options.map((text) => ({
            text,
            image: '',
            imageKey: '',
            imageProvider: '',
          })),
          correctAnswer: fix.correctAnswer,
          solution: fix.solution,
          ...(fix.answerLetter ? { 'assessmentMeta.answerLetter': fix.answerLetter } : {}),
        },
      },
    );
    if (res.modifiedCount) {
      updated += 1;
      console.log(`✓ ${fix.classLevel} #${fix.sequenceIndex}`);
    }
  }
  console.log(JSON.stringify({ updated }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
