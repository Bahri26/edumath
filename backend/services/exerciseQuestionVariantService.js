/**
 * Egzersiz otomatik oluşturma: havuzdaki sorulardan sayıları değiştirerek
 * soru çeşidine uygun yeni sorular üretir (birebir kopya değil).
 */

const Question = require('../models/Question');
const { buildTopicMongoClause } = require('../constants/patternTopics');
const { variantFromSample } = require('./poolBasedQuestionGeneratorService');
const { templateElementaryPattern } = require('./gradeAwareQuestionTemplates');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function seededIndex(key, max) {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return max > 0 ? h % max : 0;
}

function replaceNumbers(text, seed, scale = null) {
  return String(text || '').replace(/-?\d+(?:[.,]\d+)?/g, (match) => {
    const val = parseFloat(match.replace(',', '.'));
    if (!Number.isFinite(val) || Math.abs(val) >= 1000) return match;
    const base = Math.round(val);
    if (scale != null) {
      return String(Math.max(1, Math.round(base * scale)));
    }
    const delta = seededIndex(`${seed}-${match}`, 9) - 3;
    return String(Math.max(1, base + delta));
  });
}

function buildPoolMatchQuery({ classLevel, subject, topic, questionTypes }) {
  const subj = subject || 'Matematik';
  const matchStage = {
    classLevel,
    subject: { $regex: new RegExp(`^${escapeRegex(subj)}$`, 'i') },
  };
  const topicClause = buildTopicMongoClause(topic, escapeRegex);
  if (topicClause) matchStage.topic = topicClause;
  const types = Array.isArray(questionTypes) ? questionTypes.filter(Boolean) : [];
  if (types.length > 0) matchStage.type = { $in: types };
  return matchStage;
}

function variantMultipleChoice(doc, params, index) {
  const seed = `${params.classLevel}-${params.topic}-${index}`;
  const sample = {
    text: doc.text,
    options: (doc.options || []).map((o) => (typeof o === 'object' ? o.text : o) || ''),
    correctAnswer: doc.correctAnswer,
    solution: doc.solution,
    topic: doc.topic,
    difficulty: doc.difficulty,
    learningOutcome: doc.learningOutcome,
  };
  const v = variantFromSample(sample, params, index);
  if (!v) return null;
  return {
    ...v,
    type: 'multiple-choice',
    interactiveType: 'none',
    interactionData: null,
  };
}

function variantTrueFalse(doc, params, index) {
  const seed = `${params.classLevel}-tf-${index}`;
  const scale = 0.92 + seededIndex(seed, 8) / 25;
  const text = replaceNumbers(doc.text, seed, scale);
  return {
    text,
    type: 'true-false',
    interactiveType: 'none',
    interactionData: null,
    options: [{ text: 'Doğru' }, { text: 'Yanlış' }],
    correctAnswer: doc.correctAnswer,
    solution: doc.solution ? replaceNumbers(doc.solution, `${seed}-sol`, scale) : '',
    topic: params.topic || doc.topic,
    difficulty: doc.difficulty || 'Kolay',
    classLevel: params.classLevel,
    subject: params.subject,
    source: 'AI',
    learningOutcome: doc.learningOutcome || '',
  };
}

function variantFillBlank(doc, params, index) {
  const seed = `${params.classLevel}-fb-${index}`;
  const scale = 0.9 + seededIndex(seed, 10) / 20;
  const text = replaceNumbers(doc.text, seed, scale);
  const correctAnswer = replaceNumbers(doc.correctAnswer, `${seed}-ans`, scale);
  return {
    text,
    type: 'fill-blank',
    interactiveType: 'none',
    interactionData: null,
    options: [],
    correctAnswer,
    solution: doc.solution ? replaceNumbers(doc.solution, `${seed}-sol`, scale) : `Doğru cevap: ${correctAnswer}`,
    topic: params.topic || doc.topic,
    difficulty: doc.difficulty || 'Kolay',
    classLevel: params.classLevel,
    subject: params.subject,
    source: 'AI',
    learningOutcome: doc.learningOutcome || '',
  };
}

function variantMatching(doc, params, index) {
  const seed = `${params.classLevel}-match-${index}`;
  const scale = 0.9 + seededIndex(seed, 10) / 20;
  const data = doc.interactionData || {};
  const prompts = (data.prompts || []).map((p) => ({
    ...p,
    label: replaceNumbers(p.label, `${seed}-p-${p.id}`, scale),
  }));
  const options = (data.options || []).map((o) => replaceNumbers(o, `${seed}-o`, scale));
  const correctPairs = { ...(data.correctPairs || {}) };
  return {
    text: doc.text,
    type: 'matching',
    interactiveType: 'matching',
    interactionData: { prompts, options, correctPairs },
    options: [],
    correctAnswer: '__interactive_matching__',
    solution: doc.solution || `Doğru eşleştirmeler: ${JSON.stringify(correctPairs)}`,
    topic: params.topic || doc.topic,
    difficulty: doc.difficulty || 'Kolay',
    classLevel: params.classLevel,
    subject: params.subject,
    source: 'AI',
    learningOutcome: doc.learningOutcome || '',
  };
}

function variantSequence(doc, params, index) {
  const seed = `${params.classLevel}-seq-${index}`;
  const scale = 0.9 + seededIndex(seed, 10) / 20;
  const data = doc.interactionData || {};
  const items = (data.items || []).map((item) => ({
    ...item,
    label: replaceNumbers(item.label, `${seed}-i-${item.id}`, scale),
  }));
  return {
    text: doc.text,
    type: 'sequence',
    interactiveType: 'sequence',
    interactionData: {
      items,
      correctOrder: [...(data.correctOrder || [])],
    },
    options: [],
    correctAnswer: '__interactive_sequence__',
    solution: doc.solution || 'Adımları örüntü çözüm sırasına göre dizin.',
    topic: params.topic || doc.topic,
    difficulty: doc.difficulty || 'Kolay',
    classLevel: params.classLevel,
    subject: params.subject,
    source: 'AI',
    learningOutcome: doc.learningOutcome || '',
  };
}

function fallbackTemplate(type, params, index) {
  const seed = `fb-${type}-${params.classLevel}-${index}`;
  if (type === 'multiple-choice') {
    const tpl = templateElementaryPattern(params.classLevel, 'Kolay', seed);
    return {
      ...tpl,
      type: 'multiple-choice',
      interactiveType: 'none',
      interactionData: null,
      topic: params.topic || 'Örüntüler',
      classLevel: params.classLevel,
      subject: params.subject,
      source: 'AI',
      options: (tpl.options || []).map((t) => ({ text: t })),
    };
  }
  if (type === 'true-false') {
    const tpl = templateElementaryPattern(params.classLevel, 'Kolay', seed);
    const nums = (tpl.text.match(/\d+/g) || []).slice(0, 3).join(', ');
    return {
      text: `${nums} sayıları artan bir örüntü oluşturur.`,
      type: 'true-false',
      interactiveType: 'none',
      interactionData: null,
      options: [{ text: 'Doğru' }, { text: 'Yanlış' }],
      correctAnswer: 'Doğru',
      solution: 'Ardışık terimler aynı miktarda artıyorsa örüntü artandır.',
      topic: params.topic || 'Örüntüler',
      classLevel: params.classLevel,
      subject: params.subject,
      source: 'AI',
    };
  }
  if (type === 'fill-blank') {
    const tpl = templateElementaryPattern(params.classLevel, 'Kolay', seed);
    const nums = tpl.text.match(/\d+/g) || ['2', '4', '6'];
    const a = nums[0] || '2';
    const b = nums[1] || '4';
    const c = nums[2] || '6';
    const next = String(Number(c) + (Number(b) - Number(a) || 2));
    return {
      text: `${a}, ${b}, ${c}, __ örüntüsünde boşluğa hangi sayı gelir?`,
      type: 'fill-blank',
      interactiveType: 'none',
      interactionData: null,
      options: [],
      correctAnswer: next,
      solution: `Fark sabit; boşluğa ${next} gelir.`,
      topic: params.topic || 'Örüntüler',
      classLevel: params.classLevel,
      subject: params.subject,
      source: 'AI',
    };
  }
  if (type === 'matching') {
    return {
      text: 'Her örneği doğru örüntü türüyle eşleştirin.',
      type: 'matching',
      interactiveType: 'matching',
      interactionData: {
        prompts: [
          { id: 'repeat', label: `${2 + index}, ${4 + index}, ${2 + index}, ${4 + index}, ...` },
          { id: 'step', label: `${3 + index}, ${6 + index}, ${9 + index}, ...` },
        ],
        options: ['Tekrarlayan örüntü', 'Artan sayı örüntüsü'],
        correctPairs: { repeat: 'Tekrarlayan örüntü', step: 'Artan sayı örüntüsü' },
      },
      options: [],
      correctAnswer: '__interactive_matching__',
      solution: 'Tekrar eden diziler ve sabit artışlı dizileri ayırt edin.',
      topic: params.topic || 'Örüntüler — Sınıflama (eşleştirme)',
      classLevel: params.classLevel,
      subject: params.subject,
      source: 'AI',
    };
  }
  if (type === 'sequence') {
    return {
      text: 'Örüntüyü çözmek için adımları doğru sıraya koyun.',
      type: 'sequence',
      interactiveType: 'sequence',
      interactionData: {
        items: [
          { id: 'rule', label: 'Örüntüdeki kuralı bul' },
          { id: 'delta', label: 'Artış farkını kontrol et' },
          { id: 'predict', label: 'Eksik terimi tahmin et' },
        ],
        correctOrder: ['rule', 'delta', 'predict'],
      },
      options: [],
      correctAnswer: '__interactive_sequence__',
      solution: 'Önce kural, sonra fark, ardından tahmin.',
      topic: params.topic || 'Örüntüler — Çözüm adımları (sıralama)',
      classLevel: params.classLevel,
      subject: params.subject,
      source: 'AI',
    };
  }
  return null;
}

function variantFromQuestionDoc(doc, params, index) {
  const type = doc.type || 'multiple-choice';
  if (type === 'multiple-choice') return variantMultipleChoice(doc, params, index);
  if (type === 'true-false') return variantTrueFalse(doc, params, index);
  if (type === 'fill-blank') return variantFillBlank(doc, params, index);
  if (type === 'matching') return variantMatching(doc, params, index);
  if (type === 'sequence') return variantSequence(doc, params, index);
  return variantMultipleChoice(doc, params, index);
}

/**
 * Havuzdan soru çeşidine göre varyant üretir ve veritabanına kaydeder.
 */
async function generateAndSaveExerciseVariants({
  classLevel,
  subject = 'Matematik',
  topic,
  questionTypes = ['multiple-choice'],
  limit = 15,
  createdBy,
} = {}) {
  const types = [...new Set((questionTypes || []).filter(Boolean))];
  if (types.length === 0) {
    return { error: 'En az bir soru çeşidi seçilmelidir.' };
  }

  const params = {
    classLevel,
    subject,
    topic: typeof topic === 'string' && topic.trim() && topic.trim() !== 'Tümü' ? topic.trim() : 'Örüntüler',
    difficulty: 'Kolay',
  };

  const perType = Math.max(1, Math.ceil(limit / types.length));
  const variants = [];
  const seen = new Set();

  for (let ti = 0; ti < types.length; ti += 1) {
    const type = types[ti];
    const matchStage = buildPoolMatchQuery({ classLevel, subject, topic, questionTypes: [type] });
    const samples = await Question.find(matchStage)
      .select('text options correctAnswer solution type topic difficulty learningOutcome interactiveType interactionData')
      .limit(Math.max(perType * 2, 10))
      .lean();

    shuffleSamples(samples);

    let addedForType = 0;
    for (let i = 0; i < samples.length && addedForType < perType; i += 1) {
      const v = variantFromQuestionDoc(samples[i], params, ti * 100 + i);
      if (!v?.text) continue;
      const key = `${type}:${String(v.text).slice(0, 80).toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      variants.push(v);
      addedForType += 1;
    }

    while (addedForType < perType && variants.length < limit) {
      const fb = fallbackTemplate(type, params, ti * 50 + addedForType);
      if (!fb) break;
      const key = `${type}:${String(fb.text).slice(0, 80).toLowerCase()}`;
      if (seen.has(key)) {
        addedForType += 1;
        continue;
      }
      seen.add(key);
      variants.push(fb);
      addedForType += 1;
    }
  }

  const picked = variants.slice(0, limit);
  if (picked.length === 0) {
    return { error: 'Seçilen sınıf, konu ve soru çeşidine uygun soru bulunamadı.' };
  }

  const docs = picked.map((q) => ({
    ...q,
    classLevel,
    subject,
    createdBy,
    assessmentMeta: { generator: 'exercise-pool-variant' },
  }));

  const inserted = await Question.insertMany(docs);
  const questionIds = inserted.map((d) => d._id);
  const difficulties = [...new Set(inserted.map((d) => d.difficulty).filter(Boolean))];

  return { questionIds, difficulties, count: inserted.length };
}

function shuffleSamples(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

module.exports = {
  generateAndSaveExerciseVariants,
  variantFromQuestionDoc,
  buildPoolMatchQuery,
};
