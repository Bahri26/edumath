/* eslint-disable no-console */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const knex = require('../db/knex');

const SHAPE_TOKEN_MAP = {
  DAIRE: '🔵',
  CEMBER: '⭕',
  KARE: '🟦',
  UCGEN: '🔺',
  YILDIZ: '⭐',
  PENTAGON: '⬟',
  BESGEN: '⬟',
  ALTIGEN: '⬢',
  HEXAGON: '⬢',
  DIKDORTGEN: '▭'
};

const LEGACY_GLYPH_TO_EMOJI = {
  '●': '🔵',
  '○': '⭕',
  '■': '🟦',
  '▲': '🔺',
  '★': '⭐'
};

function normalizePlaceholderText(value) {
  const withPlaceholders = String(value || '').replace(/\[\s*([^\]]+?)\s*\]/g, (_full, raw) => {
    const token = String(raw || '')
      .toLocaleUpperCase('tr-TR')
      .replace(/Ç/g, 'C')
      .replace(/Ğ/g, 'G')
      .replace(/İ/g, 'I')
      .replace(/Ö/g, 'O')
      .replace(/Ş/g, 'S')
      .replace(/Ü/g, 'U')
      .trim();

    return SHAPE_TOKEN_MAP[token] || `[${token}]`;
  });

  return withPlaceholders.replace(/[●○■▲★]/g, (glyph) => LEGACY_GLYPH_TO_EMOJI[glyph] || glyph);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function normalizeQuestion(raw) {
  const options = Array.isArray(raw.options) ? raw.options : [];

  return {
    contentText: normalizePlaceholderText(raw.contentText || raw.content_text),
    topic: raw.topic || 'Oruntuler',
    difficultyLevel: (raw.difficultyLevel || raw.difficulty_level || 'medium').toLowerCase(),
    classLevel: Number(raw.classLevel || raw.class_level || 4),
    gradeLevel: Number(raw.gradeLevel || raw.grade_level || 4),
    language: raw.language || 'math',
    points: Number(raw.points || 10),
    hint: raw.hint || null,
    imageUrl: raw.imageUrl || raw.image_url || null,
    options: options.map((opt, index) => ({
      optionText: normalizePlaceholderText(opt.optionText || opt.option_text),
      isCorrect: Boolean(opt.isCorrect || opt.is_correct),
      optionOrder: Number(opt.optionOrder || opt.option_order || index + 1)
    }))
  };
}

function validateQuestion(question, index) {
  if (!question.contentText || typeof question.contentText !== 'string') {
    throw new Error(`Question #${index + 1}: contentText zorunludur.`);
  }

  if (!['easy', 'medium', 'hard'].includes(question.difficultyLevel)) {
    throw new Error(`Question #${index + 1}: difficultyLevel easy|medium|hard olmali.`);
  }

  if (!Array.isArray(question.options) || question.options.length < 2) {
    throw new Error(`Question #${index + 1}: en az 2 secenek gerekli.`);
  }

  const correctCount = question.options.filter((o) => o.isCorrect).length;
  if (correctCount !== 1) {
    throw new Error(`Question #${index + 1}: tam olarak 1 dogru secenek olmali.`);
  }
}

async function insertQuestions({ questions, creatorId, dryRun, skipDuplicates }) {
  const result = {
    inserted: 0,
    skipped: 0,
    failed: 0,
    failures: []
  };

  if (dryRun) {
    console.log(`[DRY RUN] ${questions.length} soru dogrulandi, veritabani yazimi yapilmadi.`);
    return result;
  }

  await knex.transaction(async (trx) => {
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      try {
        if (skipDuplicates) {
          const existing = await trx('questions')
            .where({
              content_text: q.contentText,
              class_level: q.classLevel,
              difficulty_level: q.difficultyLevel
            })
            .first('question_id');

          if (existing) {
            result.skipped += 1;
            continue;
          }
        }

        const [questionId] = await trx('questions').insert({
          content_text: q.contentText,
          topic: q.topic,
          difficulty_level: q.difficultyLevel,
          class_level: q.classLevel,
          grade_level: q.gradeLevel,
          language: q.language,
          points: q.points,
          hint: q.hint,
          image_url: q.imageUrl,
          creator_id: creatorId,
          created_at: new Date()
        });

        const optionRows = q.options.map((o) => ({
          question_id: questionId,
          option_text: o.optionText,
          is_correct: o.isCorrect,
          option_order: o.optionOrder
        }));

        await trx('question_options').insert(optionRows);
        result.inserted += 1;
      } catch (err) {
        result.failed += 1;
        result.failures.push({ index: i + 1, error: err.message });
      }
    }

    if (result.failed > 0) {
      throw new Error(`Import sirasinda ${result.failed} hata olustu. Islem geri alindi.`);
    }
  });

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const filePath = args.file
    ? path.resolve(process.cwd(), args.file)
    : path.resolve(__dirname, 'data', 'grade4_pattern_shape_number_questions.json');

  const creatorId = Number(args.creatorId || args.creator || process.env.IMPORT_CREATOR_ID || 1);
  const dryRun = Boolean(args.dryRun);
  const skipDuplicates = args.skipDuplicates !== 'false';

  if (!Number.isInteger(creatorId) || creatorId <= 0) {
    throw new Error('Gecerli bir --creatorId verin (pozitif tam sayi).');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`JSON dosyasi bulunamadi: ${filePath}`);
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('JSON dosyasi bos ya da dizi degil.');
  }

  const questions = raw.map(normalizeQuestion);
  questions.forEach(validateQuestion);

  console.log(`Ortam: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Dosya: ${filePath}`);
  console.log(`Toplam soru: ${questions.length}`);
  console.log(`creator_id: ${creatorId}`);
  console.log(`skipDuplicates: ${skipDuplicates}`);

  const result = await insertQuestions({ questions, creatorId, dryRun, skipDuplicates });
  console.log('Import tamamlandi:', result);
}

main()
  .catch((err) => {
    console.error('Import hatasi:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await knex.destroy();
  });
