const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { renderPatternSvg } = require('./svgPatternRenderer');
const { buildMebPromptBlock } = require('../constants/mebCurriculumContext');
const {
  fetchQuestionPoolSamples,
  formatSamplesForPrompt,
} = require('./questionPoolSamplesService');
const { generateContentAsJson } = require('./geminiJsonGeneration');
const { LEARNING_OUTCOME_BY_LABEL } = require('../constants/patternTopics');

const { DEFAULT_GEMINI_COMPLEX } = require('../constants/geminiDefaults');
const MODEL_NAME =
  process.env.GEMINI_COMPLEX_MODEL || process.env.GEMINI_MODEL || DEFAULT_GEMINI_COMPLEX;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

function buildFallbackQuestionBank() {
  return {
    '1. Sınıf': {
      Kolay: [
        {
          text: 'Renkli boncuk dizisinde kirmizi, mavi, kirmizi, mavi, ... oruntusunda siradaki boncuk hangi renktir?',
          options: ['Kirmizi', 'Mavi', 'Sari', 'Yesil'],
          correctAnswer: 'Kirmizi',
          solution: 'Oruntu iki adimda tekrar eder: kirmizi, mavi. Mavi boncuktan sonra yine kirmizi gelir.',
          learningOutcome: 'Tekrarlayan nesne ve renk oruntulerini fark eder, ayni kuralla surdurur.',
          mebReference: 'MEB Matematik Ogretim Programi (2018) - Ilkokul oruntu kazanimi',
          curriculumNote: 'Somut nesnelerle tekrar eden oruntuyu bulma ve devam ettirme becerisine odaklanir.',
          visualPrompt: 'Acik zemin uzerinde kirmizi ve mavi boncuklarin sira ile dizildigi neseli bir ilkokul calisma kagidi gorseli',
        },
        {
          text: 'Meyve tabaginda elma, armut, elma, armut, ... duzeni var. Siradaki meyve hangisidir?',
          options: ['Armut', 'Elma', 'Muz', 'Cilek'],
          correctAnswer: 'Armut',
          solution: 'Elma ve armut sira ile tekrar ediyor. Elmadan sonra armut gelir.',
          learningOutcome: 'Nesne oruntulerinde eksik ogeyi belirler ve oruntuyu tamamlar.',
          mebReference: 'MEB Matematik Ogretim Programi (2018) - Ilkokul oruntu kazanimi',
          curriculumNote: 'Gunluk yasam nesneleriyle oruntu kurali fark ettirilir.',
          visualPrompt: 'Sevimli elma ve armut cizimleriyle tekrar eden meyve oruntusu, cocuk dostu afis stili',
        },
        {
          text: 'Oyun halisinda 2, 4, 2, 4, 2, ... sayi adimlari var. Bos yere hangi sayi gelmelidir?',
          options: ['4', '2', '5', '6'],
          correctAnswer: '4',
          solution: 'Sayilar 2 ve 4 olarak donusumlu tekrar eder. 2 sayisindan sonra 4 gelir.',
          learningOutcome: 'Sayi oruntusundeki tekrar eden duzeni fark eder.',
          mebReference: 'MEB Matematik Ogretim Programi (2018) - Ilkokul oruntu kazanimi',
          curriculumNote: 'Kucuk sayilarla kurulan basit tekrarli oruntuler kullanilir.',
          visualPrompt: 'Renkli yer karolari uzerinde 2 ve 4 sayilarinin donusumlu ilerledigi okul oyunu gorseli',
        },
      ],
    },
    '5. Sınıf': {
      Orta: [
        {
          text: 'Mozaik tasarim tablosunda 8, 13, 18, 23, ... oruntusunun 9. terimi kactir?',
          options: ['48', '43', '53', '38'],
          correctAnswer: '48',
          solution: 'Oruntu her adimda 5 artar. 9. terim icin ilk terime 8 kez 5 eklenir: 8 + 40 = 48.',
          learningOutcome: 'Sabit farkli sayi oruntulerinde istenen terimi bulur.',
          mebReference: 'MEB Matematik Ogretim Programi (2018) - 5. sinif oruntu kazanimi',
          curriculumNote: 'Ogrenci, adim sayisi ile artisin iliskisini kurarak terim bulur.',
          visualPrompt: 'Renkli mozaik kutucuklarla artan sayi tablosu, her kutuda 8 13 18 23 degerleri, modern egitim infografik stili',
        },
        {
          text: 'Kutuphane raflarinda 60, 55, 50, 45, ... seklinde azalan bir duzen var. 10. terim kactir?',
          options: ['15', '20', '10', '25'],
          correctAnswer: '15',
          solution: 'Her adimda 5 azalir. 10. terim icin 9 kez 5 cikarilir: 60 - 45 = 15.',
          learningOutcome: 'Azalan sayi oruntulerinde belirli bir terimi hesaplar.',
          mebReference: 'MEB Matematik Ogretim Programi (2018) - 5. sinif oruntu kazanimi',
          curriculumNote: 'Sabit farkli azalan oruntuler gunluk baglamlarla sunulur.',
          visualPrompt: 'Kitap raflarinin basamak gibi azaldigi ve raflarda 60 55 50 45 etiketlerinin bulundugu temiz bir cizim',
        },
        {
          text: 'Kare tasarim atolyesinde 1, 4, 9, 16, ... kare sayi oruntusunun 7. terimi hangisidir?',
          options: ['49', '36', '64', '45'],
          correctAnswer: '49',
          solution: 'Bu kare sayi oruntusudur. 7. terim 7 x 7 = 49 olur.',
          learningOutcome: 'Ozel sayi oruntulerini tanir ve genel kuralini kullanir.',
          mebReference: 'MEB Matematik Ogretim Programi (2018) - 5. sinif oruntu kazanimi',
          curriculumNote: 'Kare sayilar somut desenlerle iliskilendirilir.',
          visualPrompt: '1x1, 2x2, 3x3, 4x4 kare nokta bloklariyla buyuyen desen, yesil tonlarda egitsel poster',
        },
      ],
    },
    '9. Sınıf': {
      Zor: [
        {
          text: 'Bir veri serisinde 7, 11, 15, 19, ... seklinde ilerleyen aritmetik oruntunun 25. terimi kactir?',
          options: ['103', '99', '107', '95'],
          correctAnswer: '103',
          solution: 'Aritmetik oruntude ortak fark 4 tur. a25 = 7 + 24 x 4 = 103 bulunur.',
          learningOutcome: 'Aritmetik dizi benzeri oruntulerde genel terimi kullanarak istenen terimi bulur.',
          mebReference: 'MEB Matematik Ogretim Programi (2018) - 9. sinif sayi oruntuleri',
          curriculumNote: 'Ogrenci genel terim mantigini sayisal veri serileri uzerinden yorumlar.',
          visualPrompt: 'Karanlik olmayan modern veri panelinde 7 11 15 19 degerleri ve +4 oklarinin yer aldigi lise duzeyi matematik karti',
        },
        {
          text: 'Bir desen modelinde ilk terimi 3 ve ortak farki 6 olan oruntunun genel terimi a_n = 3 + (n-1).6 seklindedir. Buna gore 18. terim kactir?',
          options: ['105', '111', '99', '108'],
          correctAnswer: '105',
          solution: 'Genel terimde n yerine 18 yazilir: 3 + 17 x 6 = 3 + 102 = 105.',
          learningOutcome: 'Genel terim ifadesi verilen oruntulerde istenen terimi hesaplar.',
          mebReference: 'MEB Matematik Ogretim Programi (2018) - 9. sinif sayi oruntuleri',
          curriculumNote: 'Cebirsel gosterim ile oruntu arasindaki bag kuvvetlendirilir.',
          visualPrompt: 'Formul karti, n yerine 18 yazilan aritmetik oruntu notu, temiz cizgisel okul materyali tasarimi',
        },
        {
          text: 'Bir kutu diziliminde 4, 7, 12, 19, ... seklinde buyuyen oruntude artislar 3, 5, 7 diye devam ediyor. Siradaki terim hangisidir?',
          options: ['28', '26', '30', '24'],
          correctAnswer: '28',
          solution: 'Artislar ardısık tek sayilarla ilerler. Sonraki artis 9 olacagi icin 19 + 9 = 28 elde edilir.',
          learningOutcome: 'Artis miktari degisen oruntulerde kuralı fark ederek sonraki terimi belirler.',
          mebReference: 'MEB Matematik Ogretim Programi (2018) - 9. sinif sayi oruntuleri',
          curriculumNote: 'Sabit olmayan fakat duzenli artislarin analizi hedeflenir.',
          visualPrompt: 'Katmanli kutu bloklari ve ustlerinde 4 7 12 19 degerleri, artis etiketleri 3 5 7 9 ile gosterilen modern matematik gorseli',
        },
      ],
    },
  };
}

/**
 * Bankada birebir sinif+zorluk yoksa en yakin kovayi sec (2. sinif+zorlukta bos kalmasin).
 */
function pickFallbackSourceQuestions(bank, classLevel, difficulty) {
  const tryGet = (cl, diff) => bank[cl]?.[diff] || [];

  let list = tryGet(classLevel, difficulty);
  if (list.length) {
    return list;
  }

  const difficulties = ['Kolay', 'Orta', 'Zor'];
  for (const d of difficulties) {
    list = tryGet(classLevel, d);
    if (list.length) {
      return list;
    }
  }

  const gradeMatch = String(classLevel || '').match(/(\d+)/);
  const g = gradeMatch ? parseInt(gradeMatch[1], 10) : 5;
  const closest = g <= 4 ? '1. Sınıf' : g <= 8 ? '5. Sınıf' : '9. Sınıf';

  list = tryGet(closest, difficulty);
  if (list.length) {
    return list;
  }

  for (const d of difficulties) {
    list = tryGet(closest, d);
    if (list.length) {
      return list;
    }
  }

  for (const cl of ['1. Sınıf', '5. Sınıf', '9. Sınıf']) {
    for (const d of difficulties) {
      list = tryGet(cl, d);
      if (list.length) {
        return list;
      }
    }
  }

  return [];
}

function flattenFallbackBank(bank) {
  const out = [];
  Object.values(bank || {}).forEach((byDifficulty) => {
    Object.values(byDifficulty || {}).forEach((arr) => {
      if (Array.isArray(arr)) out.push(...arr);
    });
  });
  return out;
}

async function generateFallbackPatternQuestions({ classLevel, difficulty, count, topic, subject }) {
  const bank = buildFallbackQuestionBank();
  let pool = pickFallbackSourceQuestions(bank, classLevel, difficulty);
  if (!pool.length) {
    pool = flattenFallbackBank(bank);
  }
  if (!pool.length) {
    return { generator: 'fallback', questions: [] };
  }

  const desired = Math.min(20, Math.max(1, Number(count) || 5));
  const picked = Array.from({ length: desired }, (_, i) => pool[i % pool.length]);

  const questions = await Promise.all(
    picked.map((question) =>
      sanitizeQuestion(
        {
          ...question,
          subject,
          topic,
          classLevel,
          difficulty,
          type: 'multiple-choice',
          source: 'AI',
        },
        { classLevel, difficulty, topic, subject }
      )
    )
  );

  return {
    generator: 'fallback',
    questions: questions.filter(Boolean),
  };
}

function getQuestionSchema() {
  return {
    description: 'MEB uyumlu, gorsel dusunmeyi destekleyen oruntu sorulari',
    type: SchemaType.ARRAY,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        text: { type: SchemaType.STRING },
        options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        correctAnswer: { type: SchemaType.STRING },
        solution: {
          type: SchemaType.STRING,
          description:
            'Adim adim cozum: 3-6 satir, her satir "1. ..." "2. ..." veya "1) ..." ile baslasin; satir kiriligi ile ayirin',
        },
        learningOutcome: { type: SchemaType.STRING },
        mebReference: { type: SchemaType.STRING },
        curriculumNote: { type: SchemaType.STRING },
        visualPrompt: { type: SchemaType.STRING },
      },
      required: [
        'text',
        'options',
        'correctAnswer',
        'solution',
        'learningOutcome',
        'mebReference',
        'curriculumNote',
        'visualPrompt',
      ],
    },
  };
}

function buildPrompt({
  classLevel,
  difficulty,
  count,
  topic,
  subject,
  poolBlock,
  groundingLine,
}) {
  const mebBlock = buildMebPromptBlock({ subject, topic, classLevel });
  const outcomeHint = LEARNING_OUTCOME_BY_LABEL[topic]
    ? `Ozellikle su kazanima yaklas: ${LEARNING_OUTCOME_BY_LABEL[topic]}`
    : '';

  return `
Sen deneyimli bir Turk matematik ogretmenisin.

${mebBlock}

GORUNTU:
- Sinif: ${classLevel}
- Konu (örüntü / kazanım kapsamı): ${topic}
- Zorluk: ${difficulty}
- Soru sayisi: ${count}
${outcomeHint ? `- ${outcomeHint}\n` : ''}

${groundingLine}

SORU BANKASI BAGLAMI (ogretmen havuzundan — BIREBIR KOPYALA YOK; yalnizca seviye ve tur):
${poolBlock}

GOREV — URETIM KURALLARI:
- Dil: dogal, kisa, Turkce ogrenci dostu.
- Soru metni "${classLevel} kolay/or ta/zor" gibi gereksiz etiketle baslamasin.
- Ilkokul: renk, sekil, nesne, oyuncak, meyve, gunluk hayat. Ortaokul/lise: tablo, veri dizisi, anlamli baglam.
- 4 secenek; tek dogru (correctAnswer tam metni options icinde yer alsin).
- Cozum (solution): adim adim; 3-6 satir, her satir "1. ... / 2. ... / 3. ..." (veya "1) ...") ile baslasin ve satir sonuyla ayirin. Son satirda kesin olarak dogru secenege nasil ulasildigi yazilsin.
- visualPrompt: SVG için kisa görsel tasarlama direktifi.
- mebReference, learningOutcome ve curriculumNote alanlarini MEVCUT MUFREDATA UYGUN bicimde tutarli yaz.
`;
}

function normalizeOptions(options, correctAnswer) {
  const uniqueOptions = [];
  for (const option of options || []) {
    const text = String(option || '').trim();
    if (text && !uniqueOptions.includes(text)) {
      uniqueOptions.push(text);
    }
  }

  const answer = String(correctAnswer || '').trim();
  if (answer && !uniqueOptions.includes(answer)) {
    uniqueOptions.unshift(answer);
  }

  return uniqueOptions.slice(0, 4);
}

async function sanitizeQuestion(question, defaults) {
  const correctAnswer = String(question.correctAnswer || '').trim();
  const options = normalizeOptions(question.options, correctAnswer);

  if (!correctAnswer || options.length < 4) {
    return null;
  }

  if (!options.includes(correctAnswer)) {
    return null;
  }

  const sanitized = {
    text: String(question.text || '').trim(),
    options,
    correctAnswer,
    solution: String(question.solution || '').trim(),
    learningOutcome: String(question.learningOutcome || '').trim(),
    mebReference: String(question.mebReference || '').trim(),
    curriculumNote: String(question.curriculumNote || '').trim(),
    visualPrompt: String(question.visualPrompt || '').trim(),
    subject: defaults.subject,
    topic: defaults.topic,
    classLevel: defaults.classLevel,
    difficulty: defaults.difficulty,
    type: 'multiple-choice',
    source: 'AI',
  };

  const generatedImage = await renderPatternSvg(sanitized);
  sanitized.image = generatedImage.url;
  sanitized.imageKey = generatedImage.key;
  sanitized.imageProvider = generatedImage.provider;
  return sanitized;
}

function buildGeminiFallbackHint(error) {
  const msg = String(error?.message || error || '').toLowerCase();
  if (msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted')) {
    return 'Gemini kota aşıldı — sorular yerel şablon bankasından oluşturuldu.';
  }
  if (msg.includes('404') || msg.includes('not found')) {
    return 'Gemini modeli bu anahtarda yok — yerel paket kullanıldı.';
  }
  return 'Gemini yanıt vermedi — yerel paket kullanıldı.';
}

async function generatePatternQuestions({
  classLevel,
  difficulty,
  count = 5,
  topic = 'Örüntüler',
  subject = 'Matematik',
  googleGrounding,
} = {}) {
  const { isLocalAi } = require('../config/aiProvider');
  if (isLocalAi()) {
    const { generateQuestionsFromPool } = require('./poolBasedQuestionGeneratorService');
    return generateQuestionsFromPool({
      classLevel,
      difficulty,
      count,
      topic,
      subject,
      googleGrounding,
    });
  }

  const client = getClient();
  if (!client) {
    const fb = await generateFallbackPatternQuestions({ classLevel, difficulty, count, topic, subject });
    return {
      ...fb,
      ...(fb.questions?.length ? { hint: 'GEMINI_API_KEY tanımlı değil; yerel paket kullanıldı.' } : {}),
    };
  }

  let poolSamples = [];
  try {
    poolSamples = await fetchQuestionPoolSamples({
      subject,
      topic,
      classLevel,
      limit: 8,
    });
  } catch (e) {
    console.warn('Havuz ornekleri alinamadi:', e.message);
  }
  const poolBlock = formatSamplesForPrompt(poolSamples);

  const useGrounding =
    googleGrounding !== false &&
    String(process.env.GEMINI_GOOGLE_GROUNDING || '1').trim() !== '0';

  const groundingLine = useGrounding
    ? 'Google Search zemini kullaniliyorsa; MEB matematik öruntu kazanımları ve yaygın eğim tanımlarını güvenilir web özetlerinden doğrula; uydurma madde kodu yazma.'
    : 'Genel akademik doğruluğa ve MEB bağlam blokuna uy.';

  const prompt = buildPrompt({
    classLevel,
    difficulty,
    count,
    topic,
    subject,
    poolBlock,
    groundingLine,
  });

  let rawQuestions;
  try {
    rawQuestions = await generateContentAsJson({
      genAI: client,
      modelName: MODEL_NAME,
      prompt,
      responseSchema: getQuestionSchema(),
      temperature: 0.22,
      enableGoogleGrounding: useGrounding,
    });
  } catch (e) {
    console.warn('Gemini üretimi basarisiz, yerel pakete dönülüyor:', e.message);
    const fb = await generateFallbackPatternQuestions({ classLevel, difficulty, count, topic, subject });
    return { ...fb, ...(fb.questions?.length ? { hint: buildGeminiFallbackHint(e) } : {}) };
  }

  if (!Array.isArray(rawQuestions)) {
    const fb = await generateFallbackPatternQuestions({ classLevel, difficulty, count, topic, subject });
    return {
      ...fb,
      ...(fb.questions?.length ? { hint: 'Geçersiz model çıktısı — yerel paket kullanıldı.' } : {}),
    };
  }

  const questions = (await Promise.all(
    rawQuestions.map((question) =>
      sanitizeQuestion(question, { classLevel, difficulty, topic, subject })
    )
  )).filter(Boolean);

  const out = { generator: 'gemini', questions };
  if (!questions.length) {
    const fb = await generateFallbackPatternQuestions({ classLevel, difficulty, count, topic, subject });
    return {
      ...fb,
      ...(fb.questions?.length ? { hint: 'Üretilen sorular doğrulanamadı — yerel paket kullanıldı.' } : {}),
    };
  }
  return out;
}

module.exports = {
  generatePatternQuestions,
  generateFallbackPatternQuestions,
  buildFallbackQuestionBank,
};