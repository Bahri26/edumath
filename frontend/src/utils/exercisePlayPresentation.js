import { hasQuestionImage } from './questionImage.js';

/**
 * Havuz sorusunu bire bir göstermek yerine (playTransform=game_show) aynı doğru cevap
 * anahtarıyla farklı etkileşim yüzeyleri seçer. Eşleştirme / sıralama dokunulmaz.
 *
 * @returns {{ key: 'default'|'num_pad'|'tf_big'|'shape_row'|'fill_play'|'tf_play' }}
 */
export function getExercisePlayPresentation(question, index, playTransform) {
  const mode = playTransform || 'classic';
  if (mode !== 'game_show') return { key: 'default' };

  const qType = question.type || 'multiple-choice';
  if (qType === 'matching' || qType === 'sequence') return { key: 'default' };
  if (qType === 'fill-blank') return { key: 'fill_play' };
  if (qType === 'true-false') return { key: 'tf_play' };
  if (hasQuestionImage(question?.image)) return { key: 'default' };

  const opts = question.options || [];
  const ca = String(question.correctAnswer ?? '').trim();
  const numeric = /^\d{1,8}$/.test(ca);
  const salt = (String(question._id || 'x') + String(index))
    .split('')
    .reduce((a, c) => a + c.charCodeAt(0), 0);

  if (opts.length >= 2 && numeric && salt % 2 === 0) return { key: 'num_pad' };
  if (opts.length === 2) return { key: 'tf_big' };
  if (opts.length >= 3 && opts.length <= 6) return { key: 'shape_row' };
  return { key: 'default' };
}
