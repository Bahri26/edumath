import sourceImages from '../data/patternPdfSourceImages.json';

export function withLocalPatternSource(question, enabled = true) {
  const meta = question?.assessmentMeta;
  if (!enabled || meta?.localSourceDisabled || meta?.contentMode === 'text' || meta?.importSource !== 'pattern-pdf-extracted-2026-08') return question;
  const source = sourceImages.find(entry => entry.gradeSlug === meta.gradeSlug
    && entry.number === meta.questionNumber
    && (entry.gradeSlug === '9-sinif' || entry.page === meta.pageNumber));
  if (!source) return question;
  return { ...question, image: `/uploads/pattern-pdf-source/${source.file}`,
    assessmentMeta: { ...meta, imageRole: 'full-question' } };
}
