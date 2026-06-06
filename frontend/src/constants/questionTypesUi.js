/** Soru bankası / egzersiz — Question.type ile uyumlu */
export const QUESTION_TYPE_OPTIONS = [
  { value: 'multiple-choice', label: 'Çoktan seçmeli' },
  { value: 'true-false', label: 'Doğru / Yanlış' },
  { value: 'fill-blank', label: 'Boşluk doldurma' },
  { value: 'matching', label: 'Eşleştirme' },
  { value: 'sequence', label: 'Sıralama' },
];

export function questionTypeLabel(value) {
  const hit = QUESTION_TYPE_OPTIONS.find((o) => o.value === value);
  return hit?.label || value || '—';
}
