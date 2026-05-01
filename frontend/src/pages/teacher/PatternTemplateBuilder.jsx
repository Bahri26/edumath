import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api';
import { generatePatternQuestionPack } from '../../services/aiService';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../context/ToastContext';
import { describeApiError } from '../../utils/errorMessage';
import { Sparkles, Wand2, Save, RefreshCw, Image as ImageIcon } from 'lucide-react';
import QuestionVisual from '../../components/questions/QuestionVisual.jsx';
import SolutionDisplay from '../../components/questions/SolutionDisplay.jsx';

const TEMPLATE_OPTIONS = [
  {
    key: 'repeat',
    label: 'Tekrarlı Örüntü (Şekil)',
    hint: 'AB / ABC tekrarları – özellikle 1–3. sınıf',
  },
  {
    key: 'arithmetic',
    label: 'Aritmetik Örüntü (Sayı)',
    hint: 'Sabit artış – 3–8. sınıf',
  },
  {
    key: 'two_step',
    label: 'İki Adımlı Kural (+/−)',
    hint: 'Art arda farklı işlemler – 5–9. sınıf',
  },
  {
    key: 'square_numbers',
    label: 'Kare Sayı Örüntüsü',
    hint: 'n² dizisi – görsel nokta yapıları',
  },
  {
    key: 'triangular_numbers',
    label: 'Üçgensel Sayı Örüntüsü',
    hint: 'T(n)=n(n+1)/2 – görsel düzen',
  },
  {
    key: 'interactive_matching',
    label: 'Etkileşimli: Eşleştirme',
    hint: 'Örüntü türlerini seçeneklerle eşleştir',
  },
  {
    key: 'interactive_sequence',
    label: 'Etkileşimli: Adım Sıralama',
    hint: 'Çözüm adımlarını doğru sıraya diz',
  },
];

const CLASS_LEVELS = [
  '1. Sınıf',
  '2. Sınıf',
  '3. Sınıf',
  '4. Sınıf',
  '5. Sınıf',
  '6. Sınıf',
  '7. Sınıf',
  '8. Sınıf',
  '9. Sınıf',
  '10. Sınıf',
  '11. Sınıf',
  '12. Sınıf',
];

export default function PatternTemplateBuilder() {
  const { showToast } = useToast();
  const [templateKey, setTemplateKey] = useState('repeat');
  const [classLevel, setClassLevel] = useState('2. Sınıf');
  const [difficulty, setDifficulty] = useState('Kolay');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiGoogleGrounding, setGeminiGoogleGrounding] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState([]);

  const selectedTemplate = useMemo(
    () => TEMPLATE_OPTIONS.find((t) => t.key === templateKey) || TEMPLATE_OPTIONS[0],
    [templateKey]
  );

  const generate = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/pattern-templates/generate', {
        templateKey,
        classLevel,
        difficulty,
        count: Number(count) || 5,
      });
      const questions = res.data?.questions || [];
      setGenerated(questions);
      showToast(`${questions.length} soru üretildi.`, 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Şablondan üretim başarısız.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /** Gemini ile MEB uyumlu örüntü paketi (+ SVG görseller); listeye ekler (şablon çıktısını silmez). */
  const appendGeminiPatternPack = async () => {
    setGeminiLoading(true);
    try {
      const data = await generatePatternQuestionPack({
        classLevel,
        difficulty,
        count: Number(count) || 5,
        topic: 'Örüntüler',
        subject: 'Matematik',
        googleGrounding: geminiGoogleGrounding,
      });
      const incoming = Array.isArray(data?.questions) ? data.questions : [];
      if (!incoming.length) {
        showToast('Paket boş döndü. Sınıf/zorluk deneyin veya sonra tekrar deneyin (Gemini kotası dolu olabilir).', 'error');
        return;
      }
      setGenerated((prev) => [...incoming, ...prev]);
      const genLabel =
        data?.generator === 'gemini' ? 'Gemini' : data?.generator === 'fallback' ? 'Yerel şablon' : data?.generator || 'AI';
      const quotaNote = data?.hint ? ` ${data.hint}` : '';
      showToast(`${incoming.length} soru eklendi (${genLabel}).${quotaNote}`, 'success');
    } catch (err) {
      showToast(describeApiError(err, 'Gemini paketi alınamadı.'), 'error');
    } finally {
      setGeminiLoading(false);
    }
  };

  const [saveProgress, setSaveProgress] = useState({ done: 0, total: 0, failed: 0 });

  const saveAllToBank = async () => {
    if (!generated.length) return;
    setSaving(true);
    setSaveProgress({ done: 0, total: generated.length, failed: 0 });
    let ok = 0;
    let failed = 0;
    for (let i = 0; i < generated.length; i += 1) {
      const q = generated[i];
      const payload = {
        text: q.text,
        options: (q.options || []).map((o) => o?.text ?? o),
        correctAnswer: q.correctAnswer,
        solution: q.solution || '',
        subject: q.subject || 'Matematik',
        topic: q.topic || 'Örüntüler',
        learningOutcome: q.learningOutcome || '',
        classLevel: q.classLevel || classLevel,
        difficulty: q.difficulty || difficulty,
        type: q.type || 'multiple-choice',
        interactiveType: q.interactiveType || 'none',
        interactionData: q.interactionData || null,
        assessmentMeta: q.assessmentMeta || undefined,
        source: 'AI',
        imagePath: q.image,
      };
      try {
        await apiClient.post('/questions', payload);
        ok += 1;
      } catch {
        failed += 1;
      }
      setSaveProgress({ done: i + 1, total: generated.length, failed });
    }
    if (ok > 0 && failed === 0) {
      showToast(`${ok} soru havuza kaydedildi.`, 'success');
    } else if (ok > 0 && failed > 0) {
      showToast(`${ok} soru kaydedildi, ${failed} soru başarısız.`, 'error');
    } else {
      showToast('Havuza kaydetme sırasında hata oluştu.', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
            <Wand2 size={18} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Örüntü Soru Oluşturucu</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Şablondan üretin veya ihtiyaç halinde Gemini ile görsel örüntü paketi ekleyin; önizlemede birlikte görünür, havuza aynı akıştan kaydedersiniz.
        </p>
        <Link
          to="/teacher/questions"
          className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-500 w-fit"
        >
          Soru bankasına dön
        </Link>
      </div>

      <Card className="p-6 rounded-[1.5rem]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Şablon</label>
            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              className="mt-2 w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-slate-400">{selectedTemplate.hint}</div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sınıf</label>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="mt-2 w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
            >
              {CLASS_LEVELS.map((cl) => (
                <option key={cl} value={cl}>
                  {cl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zorluk</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mt-2 w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
            >
              {['Kolay', 'Orta', 'Zor'].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adet</label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="mt-2 w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
            />
          </div>

          <div className="md:col-span-3 flex flex-col gap-3">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={geminiGoogleGrounding}
                onChange={(e) => setGeminiGoogleGrounding(e.target.checked)}
              />
              <span>
                Gemini paketinde <strong className="text-slate-800 dark:text-slate-100">Google araması</strong> (MEB bağlamını güvenilir webden desteklemek için; daha yavaş kota kullanabilir)
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="md" onClick={generate} disabled={loading || geminiLoading}>
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />} Şablondan üret
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={appendGeminiPatternPack}
              disabled={geminiLoading || loading}
              title="GEMINI_API_KEY tanımlıysa Gemini; yoksa sunucudaki yerel paket kullanılır."
            >
              {geminiLoading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />} Gemini örüntü paketi ekle
            </Button>
            <Button variant="outline" size="md" onClick={saveAllToBank} disabled={saving || !generated.length}>
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} Havuza Kaydet
            </Button>
            </div>
            {saving && saveProgress.total > 0 && (
              <div className="space-y-1" aria-live="polite">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Kaydediliyor: {saveProgress.done}/{saveProgress.total}
                  {saveProgress.failed > 0 ? ` • ${saveProgress.failed} başarısız` : ''}
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-[width] duration-200"
                    style={{ width: `${Math.round((saveProgress.done / Math.max(1, saveProgress.total)) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {generated.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {generated.map((q, idx) => (
            <Card key={q.imageKey || idx} className="p-6 rounded-[1.5rem] space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {q.classLevel} • {q.difficulty}
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold">
                  <ImageIcon size={14} /> SVG
                </div>
              </div>
              <div className="text-slate-900 dark:text-slate-100 font-semibold">{q.text}</div>
              {q.image && (
                <QuestionVisual src={q.image} alt="Örüntü" className="w-full" />
              )}
              {(q.type === 'matching' || q.type === 'sequence') ? (
                <div className="text-xs text-slate-500 dark:text-slate-300 rounded-2xl border border-slate-100 dark:border-slate-700 p-3 whitespace-pre-wrap">
                  {JSON.stringify(q.interactionData || {}, null, 2)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {(q.options || []).map((opt, i) => {
                    const text = opt?.text ?? opt;
                    const isCorrect = text === q.correctAnswer;
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-2xl border-2 text-sm font-semibold ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-500/10'
                            : 'border-slate-100 dark:border-slate-700'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}) {text}
                      </div>
                    );
                  })}
                </div>
              )}
              {q.assessmentMeta && (
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  Meta: <span className="font-mono">{q.assessmentMeta.templateKey}</span>
                  {Array.isArray(q.assessmentMeta.skillTags) && q.assessmentMeta.skillTags.length ? ` • ${q.assessmentMeta.skillTags.join(', ')}` : ''}
                </div>
              )}
              {q.solution && (
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-bold text-[10px] uppercase tracking-wide text-indigo-600 dark:text-indigo-400 mb-1">
                    Adım adım çözüm
                  </p>
                  <SolutionDisplay text={q.solution} className="italic" />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

