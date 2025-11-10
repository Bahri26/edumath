// backend-express/controllers/aiController.js
// Basit kural tabanlı çözüm açıklayıcı (LLM yerine yerel heuristik)

function toNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return NaN;
  // Türkçe ondalık virgül desteği
  const normalized = String(str).replace(',', '.').replace(/[^0-9.\-]/g, '');
  return parseFloat(normalized);
}

function extractFirstNumbers(text) {
  const nums = (text.match(/[-+]?[0-9]*\.?[0-9]+/g) || []).map(n => toNumber(n));
  return nums;
}

function buildMarkdownSteps(title, steps, resultLine) {
  const lines = [
    `**Çözüm:** ${title}`,
    '',
    ...steps.map((s, i) => `${i + 1}. ${s}`),
  ];
  if (resultLine) {
    lines.push('', `> Sonuç: **${resultLine}**`);
  }
  return lines.join('\n');
}

exports.explainSolution = async (req, res) => {
  try {
    const { text = '', options = [], correctAnswer = '', topic = '', difficulty = '' } = req.body || {};
    const lower = (text || '').toLowerCase();

    // 1) Aritmetik dizi
    if (lower.includes('aritmetik') || lower.includes('dizi')) {
      // Ör: "2, 5, 8, 11, ..." ve "20. terimi"
      const numsInText = extractFirstNumbers(text);
      // İlk iki sayıdan farkı tahmin et
      let a1 = numsInText[0];
      let d = (numsInText.length > 1) ? (numsInText[1] - numsInText[0]) : undefined;
      // n'i metinden çek ("20. terimi" gibi)
      const nMatch = text.match(/(\d+)\.?\s*terim/i);
      const n = nMatch ? parseInt(nMatch[1], 10) : undefined;

      const steps = [];
      if (a1 != null && !isNaN(a1)) steps.push(`İlk terim: $a_1 = ${a1}$.`);
      if (d != null && !isNaN(d)) steps.push(`Ortak fark: $d = ${d}$ (ardışık iki terim farkı).`);
      if (n) steps.push(`İstenen terim: $a_{${n}}$.`);
      steps.push(`Aritmetik dizide formül: $a_n = a_1 + (n-1)\cdot d$.`);
      let resultLine = '';
      if (a1 != null && d != null && n) {
        const an = a1 + (n - 1) * d;
        resultLine = `$a_{${n}} = ${a1} + (${n}-1)\cdot ${d} = ${an}$`;
      } else if (correctAnswer) {
        resultLine = `Doğru cevap: ${correctAnswer}`;
      }
      const solutionMarkdown = buildMarkdownSteps('Aritmetik dizi adımları:', steps, resultLine);
      return res.json({ solutionMarkdown, outlineSteps: steps });
    }

    // 2) Dikdörtgen alanı
    if (lower.includes('dikdörtgen') && lower.includes('alan')) {
      // "alanı 48" ve "uzun kenarı 8" gibi.
      const areaMatch = text.match(/alan[ıi]?\s*(?:[:=])?\s*(\d+[\,\.]?\d*)/i);
      const longMatch = text.match(/uzun\s*kenar[ıi]?\s*(?:[:=])?\s*(\d+[\,\.]?\d*)/i);
      const A = areaMatch ? toNumber(areaMatch[1]) : undefined;
      const L = longMatch ? toNumber(longMatch[1]) : undefined;
      const steps = [
        'Dikdörtgende alan: $A = uzun \\times kısa$.',
      ];
      if (!isNaN(A)) steps.push(`Verilen alan: $A = ${A}$.`);
      if (!isNaN(L)) steps.push(`Verilen uzun kenar: $U = ${L}$.`);
      steps.push('Kısa kenar: $K = A / U$.');
      let resultLine = '';
      if (!isNaN(A) && !isNaN(L) && L !== 0) {
        const K = A / L;
        resultLine = `$K = ${A} / ${L} = ${K}$`;
      } else if (correctAnswer) {
        resultLine = `Doğru cevap: ${correctAnswer}`;
      }
      const solutionMarkdown = buildMarkdownSteps('Dikdörtgen alan hesabı:', steps, resultLine);
      return res.json({ solutionMarkdown, outlineSteps: steps });
    }

    // 3) Yüzde artış/azalış
    if ((lower.includes('%') || lower.includes('yüzde')) && (lower.includes('art') || lower.includes('azal'))) {
      // "%20 artarak 120 TL" gibi
      const pctMatch = text.match(/%\s*(\d+[\,\.]?\d*)/);
      const finalMatch = text.match(/(\d+[\,\.]?\d*)\s*(?:tl|₺)?\s*(?:olmu(?:ştur|stur)|olur|olmuş)/i);
      const p = pctMatch ? toNumber(pctMatch[1]) : undefined;
      const F = finalMatch ? toNumber(finalMatch[1]) : undefined;
      const steps = [];
      if (!isNaN(p)) steps.push(`Artış oranı: $p = ${p}\%$ → katsayı: $(1 + p/100)$.`);
      if (!isNaN(F)) steps.push(`Yeni (artmış) fiyat: $F = ${F}$.`);
      steps.push('Eski fiyat: $E = F / (1 + p/100)$.');
      let resultLine = '';
      if (!isNaN(p) && !isNaN(F)) {
        const E = F / (1 + p / 100);
        resultLine = `$E = ${F} / (1 + ${p}/100) = ${E.toFixed(2)}$`;
      } else if (correctAnswer) {
        resultLine = `Doğru cevap: ${correctAnswer}`;
      }
      const solutionMarkdown = buildMarkdownSteps('Yüzde artış hesabı:', steps, resultLine);
      return res.json({ solutionMarkdown, outlineSteps: steps });
    }

    // 4) Genel şablon (fallback)
    const steps = [
      'Verilenleri not edin ve isteneni belirleyin.',
      'Uygun formülü veya kuralı seçin.',
      'Değerleri yerine koyup adım adım işlemleri yapın.',
      'Ara sonuçları kontrol ederek sadeleştirin.',
      'Sonucu birimle yazın ve mantık kontrolü yapın.'
    ];
    const solutionMarkdown = buildMarkdownSteps('Genel çözüm yaklaşımı:', steps, correctAnswer ? `Doğru cevap: ${correctAnswer}` : undefined);
    return res.json({ solutionMarkdown, outlineSteps: steps });
  } catch (err) {
    console.error('AI explain error:', err);
    return res.status(500).json({ message: 'Çözüm oluşturulamadı.' });
  }
};

// Basit şablon tabanlı soru üretici (prototype)
const mongoose = require('mongoose');
const Question = require('../models/Question');

exports.generateQuestions = async (req, res) => {
  try {
    const { subject = 'Matematik', classLevel = '9. Sınıf', topic = '', difficulty = 'Orta', count = 3, seedQuestionIds = [] } = req.body || {};
    const n = Math.max(1, Math.min(10, parseInt(count, 10) || 3));

    const makeNumericTest = (i) => {
      // vary parameters by index + difficulty
      const base = 2 + i * 3 + (difficulty === 'Zor' ? 5 : difficulty === 'Kolay' ? 0 : 2);
      const a = base;
      const b = base + (difficulty === 'Kolay' ? 2 : 3);
      const correct = a + b;
      return {
        subject,
        classLevel,
        topic: topic || 'Temel işlemler',
        learningOutcome: `Basit toplama ve çıkarma becerisi (${classLevel})`,
        questionType: 'test',
        difficulty,
        text: `İki sayının toplamı: ${a} + ${b} = ?`,
        options: [`${correct}`, `${correct + 1}`, `${Math.max(1, correct - 1)}`, `${correct + 5}`],
        correctAnswer: `${correct}`,
        solutionText: `**Çözüm:**\n\n1. Adım: ${a} ve ${b} sayılarını toplayın.\n2. Adım: ${a} + ${b} = ${correct}.\n\n> Sonuç: **${correct}**`,
      };
    };

    const makeAlgebra = (i) => {
      const x = 3 + i;
      const c = (difficulty === 'Zor' ? 5 : 2) + i;
      const rhs = x * x + c;
      return {
        subject,
        classLevel,
        topic: topic || 'Denklemler',
        learningOutcome: `Basit ikinci dereceden denklemleri çözme (${classLevel})`,
        questionType: 'bosluk-doldurma',
        difficulty,
        text: `\\$x^2 + ${c} = ${rhs}\\$ ise \\$x\\$ kaçtır?`,
        options: [],
        correctAnswer: `${x}`,
        solutionText: `**Çözüm:**\\n\\n1. Adım: Denklemi sadeleştir: $x^2 = ${rhs} - ${c} = ${x * x}$.\\n2. Adım: $x = \\pm ${x}$.\\n\\n> Sonuç: **${x} veya -${x}**`,
      };
    };

    // If seedQuestionIds provided, fetch those and create variations
    const drafts = [];
    if (Array.isArray(seedQuestionIds) && seedQuestionIds.length > 0) {
      // limit how many seeds we read
      const ids = seedQuestionIds.slice(0, 10).map(id => {
        try { return mongoose.Types.ObjectId(id); } catch (e) { return null; }
      }).filter(Boolean);
      const seeds = await Question.find({ _id: { $in: ids } }).lean().limit(10);
      // produce up to n drafts by varying each seed
      let i = 0;
      while (drafts.length < n && i < seeds.length) {
        const s = seeds[i];
        // simple variation: bump numbers found in text/options by +1
        const delta = 1 + (drafts.length % 3);
        const varyNumbers = (text) => {
          if (!text) return text;
          return text.replace(/(\d+[\,\.]?\d*)/g, (m) => {
            const num = toNumber(m);
            if (isNaN(num)) return m;
            return String(num + delta);
          });
        };
        const newText = varyNumbers(s.text);
        const newOptions = Array.isArray(s.options) ? s.options.map(o => varyNumbers(o)) : [];
        const newCorrect = (() => {
          if (!s.correctAnswer) return s.correctAnswer;
          const num = toNumber(s.correctAnswer);
          if (!isNaN(num)) return String(num + delta);
          // otherwise try to map from options
          if (newOptions.length) {
            const match = newOptions.find(opt => opt.includes(String(s.correctAnswer)));
            return match || s.correctAnswer;
          }
          return s.correctAnswer;
        })();

        drafts.push({
          subject: s.subject || subject,
          classLevel: s.classLevel || classLevel,
          topic: s.topic || topic,
          learningOutcome: s.learningOutcome || '',
          questionType: s.questionType || 'test',
          difficulty: s.difficulty || difficulty,
          text: newText,
          options: newOptions,
          correctAnswer: newCorrect,
          solutionText: s.solutionText ? varyNumbers(s.solutionText) : ''
        });
        i += 1;
      }
    }

    // if not enough drafts created from seeds, fill with template ones
    for (let j = drafts.length; j < n; j++) {
      const i = j;
      if (i % 2 === 0) drafts.push(makeNumericTest(i));
      else drafts.push(makeAlgebra(i));
    }

    return res.json({ drafts });
  } catch (err) {
    console.error('AI generate error:', err);
    return res.status(500).json({ message: 'Soru üretilemedi.' });
  }
};
