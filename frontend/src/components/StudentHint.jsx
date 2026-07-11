import React, { useState } from 'react';
import { Lightbulb, Loader2, AlertTriangle } from 'lucide-react';
import { getHint as fetchHint } from '../services/aiService';
import { describeApiError } from '../utils/errorMessage';

/**
 * Öğrenci sorularının altında gösterilen "İpucu Al" düğmesi.
 * - İpucu doğrudan görünmez; öğrenci açıkça istediğinde çağrılır.
 * - Backend her istekte LearningEvent (type:'hint') yazar; öğretmen
 *   "Öğretmen Raporları" sayfasında hangi öğrencinin nerede zorlandığını
 *   görebilir.
 *
 * Props:
 *  - questionId, questionText, studentAnswer, topic, subject
 *  - compact: küçük variant
 */
export default function StudentHint({
  questionId,
  questionText,
  studentAnswer,
  topic,
  subject,
  compact = false,
  onHintUsed,
}) {
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requested, setRequested] = useState(false);

  const handleRequest = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    setRequested(true);
    try {
      const data = await fetchHint({
        questionId,
        questionText,
        studentAnswer,
        topic,
        subject,
      });
      setHint(String(data?.hint || '').trim());
      onHintUsed?.(questionId);
    } catch (err) {
      const msg = describeApiError(err, { fallback: 'İpucu alınamadı.' });
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`mt-3 ${compact ? 'text-xs' : 'text-sm'}`}>
      <button
        type="button"
        onClick={handleRequest}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/50 dark:hover:bg-amber-900/40 transition-colors px-3 py-2 font-medium ${
          compact ? 'px-2.5 py-1.5 text-xs' : ''
        } ${loading ? 'opacity-70 cursor-wait' : ''}`}
        aria-busy={loading}
        aria-label="Bu soru için ipucu al"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={compact ? 14 : 16} />
        ) : (
          <Lightbulb size={compact ? 14 : 16} />
        )}
        {loading ? 'İpucu hazırlanıyor…' : requested && hint ? 'Yeni ipucu' : 'İpucu al'}
      </button>

      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-700/50">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {hint && !error && (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-100">
          <div className="flex items-start gap-2">
            <Lightbulb size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold mb-0.5">İpucu</div>
              <div className="leading-relaxed whitespace-pre-line">{hint}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
