import React, { useEffect, useState } from 'react';
import { X, Wand2, Loader2, Check, ChevronRight } from 'lucide-react';
import { generateQuiz } from '../../services/aiService';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { describeApiError } from '../../utils/errorMessage';
import QuestionSourceBadge from '../questions/QuestionSourceBadge.jsx';
import Button from '../ui/Button.jsx';
import { PATTERN_TOPIC_ORDER, PATTERN_TOPIC_ALL_UNDER } from '../../constants/patternTopicsUi';

const CLASS_OPTS = Array.from({ length: 12 }, (_, i) => `${i + 1}. Sınıf`);

function resolveDefaultTopic(filters) {
  const t = filters?.topic;
  if (t && t !== 'Tümü' && t !== PATTERN_TOPIC_ALL_UNDER) {
    return t;
  }
  return filters?.subject === 'Matematik' || !filters?.subject || filters?.subject === 'Tümü'
    ? PATTERN_TOPIC_ORDER[0]
    : '';
}

export default function AiGenerateQuizModal({
  isOpen,
  onClose,
  profile,
  filterDefaults,
  onRequestEditOne,
  onSaved,
}) {
  const { showToast } = useToast();
  const [step, setStep] = useState('form');
  const [topic, setTopic] = useState('');
  const [classLevel, setClassLevel] = useState('9. Sınıf');
  const [difficulty, setDifficulty] = useState('Orta');
  const [count, setCount] = useState(5);
  const [useGoogleGrounding, setUseGoogleGrounding] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState([]);
  const [generateHint, setGenerateHint] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setStep('form');
    setGenerated([]);
    setGenerateHint('');
    const fd = filterDefaults || {};
    setTopic(resolveDefaultTopic(fd));
    setClassLevel(fd.classLevel && fd.classLevel !== 'Tümü' ? fd.classLevel : '9. Sınıf');
    setDifficulty(fd.difficulty && fd.difficulty !== 'Tümü' ? fd.difficulty : 'Orta');
    setCount(5);
    setUseGoogleGrounding(true);
  }, [isOpen, filterDefaults]);

  if (!isOpen) return null;

  const resolvedSubject =
    profile?.branchApproval === 'approved' && profile?.branch
      ? profile.branch
      : fdSubject();

  function fdSubject() {
    const s = filterDefaults?.subject;
    return s && s !== 'Tümü' ? s : 'Matematik';
  }

  const handleGenerate = async () => {
    const topicTrim = topic.trim();
    if (!topicTrim) {
      showToast('Konu / ünite adı yazın.', 'error');
      return;
    }
    const n = Math.min(15, Math.max(1, Number(count) || 1));
    setLoading(true);
    try {
      const raw = await generateQuiz({
        topic: topicTrim,
        difficulty,
        count: n,
        classLevel,
        subject: resolvedSubject,
        googleGrounding: useGoogleGrounding,
      });
      const list = Array.isArray(raw?.questions) ? raw.questions : Array.isArray(raw) ? raw : [];
      const hint = raw?.hint || raw?.meta?.hint || '';
      if (!list.length) {
        showToast('Üretilen soru bulunamadı.', 'error');
        return;
      }
      setGenerated(list);
      setGenerateHint(hint);
      setStep('preview');
      showToast(hint || `${list.length} soru üretildi.`, 'success');
    } catch (err) {
      showToast(describeApiError(err, 'Soru üretilemedi.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const mapBatchItem = (q) => ({
    text: q.text || '',
    options: (q.options || [])
      .slice(0, 4)
      .map((opt) => ({ text: String(typeof opt === 'string' ? opt : opt?.text ?? '') })),
    correctAnswer: String(q.correctAnswer || '').trim(),
    solution: String(q.explanation ?? q.solution ?? '').trim(),
    subject: resolvedSubject,
    topic: topic.trim() || 'Genel',
    classLevel,
    difficulty,
    type: 'multiple-choice',
    source: 'AI',
    assessmentMeta: { origin: 'ai-generate' },
    learningOutcome: String(q.learningOutcome || '').trim(),
    mebReference: String(q.mebReference || '').trim(),
  });

  const handleSaveAll = async () => {
    if (!generated.length) return;
    setSaving(true);
    try {
      const questions = generated.map(mapBatchItem).filter((row) => row.text && row.correctAnswer && row.options.length >= 2);
      if (!questions.length) {
        showToast('Kaydedilecek geçerli soru yok.', 'error');
        return;
      }
      await apiClient.post('/questions/batch', { questions });
      showToast(`${questions.length} soru havuza eklendi.`, 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      showToast(describeApiError(err, 'Toplu kayıt başarısız.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditFirst = () => {
    const q = generated[0];
    if (!q || typeof onRequestEditOne !== 'function') return;
    const opts = (q.options || []).map((o) => String(typeof o === 'string' ? o : o?.text ?? ''));
    const padded = [...opts, '', '', '', '', ''].slice(0, 5);
    onRequestEditOne({
      text: q.text || '',
      subject: resolvedSubject,
      topic: topic.trim() || (resolvedSubject === 'Matematik' ? PATTERN_TOPIC_ORDER[0] : ''),
      learningOutcome: String(q.learningOutcome || '').trim(),
      classLevel,
      difficulty,
      correctAnswer: String(q.correctAnswer || ''),
      solution: String(q.explanation ?? q.solution ?? ''),
      options: padded,
      source: 'AI',
      assessmentMeta: { origin: 'ai-generate' },
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-label="AI ile çoktan seçmeli soru üret"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="bg-white dark:bg-surface-800 w-full max-w-3xl rounded-[2rem] shadow-soft overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
        <div className="p-6 bg-gradient-to-r from-teal-700 to-sky-700 text-white flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white/20 shrink-0">
              <Wand2 size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold truncate">AI ile çoktan seçmeli üret</h3>
              <p className="text-[10px] font-bold opacity-85 uppercase tracking-widest">
                {step === 'form' ? 'Konu seç → üret → havuza ekle veya düzenle' : 'Önizleme'}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose} ariaLabel="Kapat">
            <X size={16} />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {step === 'form' ? (
            <>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400">Konu veya ünite</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Örn. Doğrusal fonksiyonlar, üçgende alan..."
                  className="mt-2 w-full px-4 py-3 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                />
                <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                  Ders: <span className="font-bold text-surface-700 dark:text-surface-200">{resolvedSubject}</span> — üretilen sorular bu branşa kaydedilir.
                  Örnek alınırken yalnızca metin tabanlı sorular kullanılır; görselli sorular havuz örneği sayılmaz.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-surface-400">Sınıf</label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none text-sm font-bold"
                  >
                    {CLASS_OPTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-surface-400">Zorluk</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none text-sm font-bold"
                  >
                    {['Kolay', 'Orta', 'Zor'].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-surface-400">Adet (1–15)</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none text-sm font-bold"
                  />
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer text-sm text-surface-700 dark:text-surface-300">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-surface-300 text-teal-600 focus:ring-teal-500"
                  checked={useGoogleGrounding}
                  onChange={(e) => setUseGoogleGrounding(e.target.checked)}
                />
                <span>
                  <span className="font-bold text-surface-800 dark:text-surface-100">Google araması ile kaynaklama</span>
                  <span className="block text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    MEB müfredatı ile uyum için güvenilir web özetlerini kullanmayı dener (biraz daha yavaş olabilir; sunucuda
                    GEMINI_GOOGLE_GROUNDING=0 ile tamamen kapatılabilir).
                  </span>
                </span>
              </label>
            </>
          ) : (
            <>
              {generateHint && (
                <p className="text-xs font-medium text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800 rounded-xl px-4 py-3 flex flex-wrap items-center gap-2">
                  <QuestionSourceBadge
                    question={{ source: 'AI', assessmentMeta: { origin: 'ai-generate' } }}
                    size="sm"
                  />
                  <span>{generateHint}</span>
                </p>
              )}
            <ul className="space-y-3">
              {generated.map((q, i) => (
                <li
                  key={i}
                  className="rounded-2xl border border-surface-100 dark:border-surface-700 p-4 bg-surface-50/80 dark:bg-surface-900/40"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-wider">#{i + 1}</span>
                    <QuestionSourceBadge
                      question={{ source: 'AI', assessmentMeta: { origin: 'ai-generate' } }}
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-100 font-semibold">{q.text}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Doğru: <span className="font-bold text-emerald-600">{String(q.correctAnswer || '')}</span>
                  </p>
                  {(q.mebReference || q.learningOutcome) && (
                    <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 leading-snug">
                      {q.mebReference && <span className="block">MEB: {q.mebReference}</span>}
                      {q.learningOutcome && <span className="block">Kazanım: {q.learningOutcome}</span>}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            </>
          )}
        </div>

        <div className="p-6 pt-0 flex flex-wrap gap-3 justify-end border-t border-slate-100 dark:border-slate-700">
          {step === 'preview' && (
            <Button variant="outline" size="md" onClick={() => setStep('form')} disabled={loading || saving}>
              Geri
            </Button>
          )}
          <Button variant="outline" size="md" onClick={onClose} disabled={saving}>
            Kapat
          </Button>
          {step === 'form' ? (
            <Button variant="primary" size="md" onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Üretiliyor…
                </>
              ) : (
                <>
                  <Wand2 size={18} /> Üret
                </>
              )}
            </Button>
          ) : (
            <>
              {typeof onRequestEditOne === 'function' && (
                <Button variant="outline" size="md" onClick={handleEditFirst} disabled={saving}>
                  <ChevronRight size={18} /> İlk soruyu düzenle
                </Button>
              )}
              <Button variant="primary" size="md" onClick={handleSaveAll} disabled={saving || !generated.length}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Kaydediliyor…
                  </>
                ) : (
                  <>
                    <Check size={18} /> Tümünü havuza kaydet
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
