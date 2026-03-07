/* eslint-disable no-console */
require('dotenv').config();

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

async function main() {
  const dryRun = process.argv.includes('--dryRun');

  const questionRows = await knex('questions')
    .select('question_id', 'content_text')
    .where(function whereQuestionCandidates() {
      this.where('content_text', 'like', '%[%]%')
        .orWhere('content_text', 'like', '%●%')
        .orWhere('content_text', 'like', '%○%')
        .orWhere('content_text', 'like', '%■%')
        .orWhere('content_text', 'like', '%▲%')
        .orWhere('content_text', 'like', '%★%');
    });

  const optionRows = await knex('question_options')
    .select('option_id', 'option_text')
    .where(function whereOptionCandidates() {
      this.where('option_text', 'like', '%[%]%')
        .orWhere('option_text', 'like', '%●%')
        .orWhere('option_text', 'like', '%○%')
        .orWhere('option_text', 'like', '%■%')
        .orWhere('option_text', 'like', '%▲%')
        .orWhere('option_text', 'like', '%★%');
    });

  let qUpdated = 0;
  let oUpdated = 0;

  if (!dryRun) {
    await knex.transaction(async (trx) => {
      for (const row of questionRows) {
        const next = normalizePlaceholderText(row.content_text);
        if (next !== row.content_text) {
          await trx('questions').where({ question_id: row.question_id }).update({ content_text: next });
          qUpdated += 1;
        }
      }

      for (const row of optionRows) {
        const next = normalizePlaceholderText(row.option_text);
        if (next !== row.option_text) {
          await trx('question_options').where({ option_id: row.option_id }).update({ option_text: next });
          oUpdated += 1;
        }
      }
    });
  }

  console.log({
    dryRun,
    questionCandidates: questionRows.length,
    optionCandidates: optionRows.length,
    updatedQuestions: qUpdated,
    updatedOptions: oUpdated
  });
}

main()
  .catch((err) => {
    console.error('Normalize hatasi:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await knex.destroy();
  });
